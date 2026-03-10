/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: 'smelly',

  extras: $ => [/\s/, $.comment],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.arg_list, $.paren_expr],
    [$.binary_expr, $.lambda],
    [$.pattern, $.primary],
    [$.array_pattern, $.list_literal],
    [$.map_pattern, $.map_literal],
    [$.arm_expr, $.expr],
    [$.block_call, $.primary],
  ],

  rules: {
    program: $ => repeat($.stmt),

    stmt: $ => choice(
      $.module_decl,
      $.import_stmt,
      $.macro_def,
      $.type_def,
      $.extern_fn,
      $.fn_def,
      $.const_decl,
      $.region_stmt,
      $.if_stmt,
      $.while_stmt,
      $.match_stmt,
      $.block_call,
      $.assign_stmt,
      $.expr_stmt,
    ),

    // module Math
    module_decl: $ => seq('module', field('name', $.identifier)),

    // import "math"
    import_stmt: $ => seq('import', field('path', $.string)),

    // type Point = x: i32  y: i32 end
    type_def: $ => seq(
      'type',
      field('name', $.identifier),
      '=',
      field('fields', $.field_list),
      'end',
    ),

    field_list: $ => repeat1($.param),

    // extern fn puts(s: String) -> i32
    extern_fn: $ => seq(
      'extern', 'fn',
      field('name', $.identifier),
      '(',
      optional($.param_list),
      ')',
      optional(seq('->', field('return_type', $.type))),
    ),

    // fn add(a: i32, b: i32) -> i32 = ... end
    fn_def: $ => seq(
      'fn',
      field('name', $.identifier),
      '(',
      optional($.param_list),
      ')',
      optional(seq('->', field('return_type', $.type))),
      '=',
      field('body', $.block),
      'end',
    ),

    // const x = 42
    const_decl: $ => seq(
      'const',
      field('name', $.identifier),
      optional(seq(':', field('type', $.type))),
      '=',
      field('value', $.expr),
    ),

    // region pool = ... end
    region_stmt: $ => seq(
      'region',
      field('name', $.identifier),
      '=',
      field('body', $.block),
      'end',
    ),

    // if cond then ... else ... end
    if_stmt: $ => seq(
      'if',
      field('condition', $.expr),
      'then',
      field('then', $.block),
      optional(seq('else', field('else', $.block))),
      'end',
    ),

    // while cond do ... end
    while_stmt: $ => seq(
      'while',
      field('condition', $.expr),
      'do',
      field('body', $.block),
      'end',
    ),

    // match value ... end
    match_stmt: $ => seq(
      'match',
      field('value', $.expr),
      repeat1($.match_arm),
      'end',
    ),

    match_arm: $ => seq(
      field('pattern', $.pattern),
      '->',
      field('body', $.arm_expr),
    ),

    // Like expr but without index_expr at top level, so [pattern] on the
    // next line doesn't get consumed as an index on this arm's body
    arm_expr: $ => choice(
      $.binary_expr,
      $.unary_expr,
      $.call_expr,
      $.field_expr,
      $.method_expr,
      $.primary,
    ),

    pattern: $ => choice(
      $.type_pattern,
      $.integer,
      $.float,
      $.string,
      $.true,
      $.false,
      $.identifier,
      '_',
      $.array_pattern,
      $.map_pattern,
    ),

    // Match on type: i32, String, i32 n (with binding)
    type_pattern: $ => seq(
      field('type_name', $.primitive_type),
      optional(field('binding', $.identifier)),
    ),

    array_pattern: $ => seq(
      '[',
      optional(seq($.pattern, repeat(seq(',', $.pattern)))),
      ']',
    ),

    map_pattern: $ => seq(
      '{',
      optional(seq($.map_pattern_entry, repeat(seq(',', $.map_pattern_entry)))),
      '}',
    ),

    map_pattern_entry: $ => seq(
      field('key', $.identifier),
      ':',
      field('value', $.pattern),
    ),

    // Generic block macro call: name arg = ... end  OR  name(args) = ... end
    block_call: $ => seq(
      field('name', $.identifier),
      field('arg', $.expr),
      '=',
      field('body', $.block),
      'end',
    ),

    // x = expr (mutable assignment)
    assign_stmt: $ => prec.right(seq(
      field('name', $.identifier),
      '=',
      field('value', $.expr),
    )),

    // expression as statement
    expr_stmt: $ => $.expr,

    block: $ => repeat1($.stmt),

    param_list: $ => seq($.param, repeat(seq(',', $.param))),
    param: $ => seq(field('name', $.identifier), ':', field('type', $.type)),

    // Types
    type: $ => choice(
      $.ref_type,
      $.primitive_type,
      $.named_type,
    ),

    ref_type: $ => seq('&', $.type),

    primitive_type: $ => choice(
      'i8', 'i16', 'i32', 'i64', 'i128',
      'f32', 'f64',
      'Bool', 'String', 'Any', 'Gen', 'Pid',
    ),

    named_type: $ => prec.left(seq(
      $.identifier,
      optional(seq('[', $.type, repeat(seq(',', $.type)), ']')),
    )),

    // Expressions with precedence
    // yield expr (inside generators) - lowest precedence
    yield_expr: $ => prec.right(-1, seq('yield', $.expr)),

    // receive as expression (for use in assignments)
    receive_expr: $ => seq('receive', repeat1($.match_arm), 'end'),

    expr: $ => choice(
      $.yield_expr,
      $.receive_expr,
      $.binary_expr,
      $.unary_expr,
      $.call_expr,
      $.index_expr,
      $.field_expr,
      $.method_expr,
      $.primary,
    ),

    binary_expr: $ => choice(
      prec.left(0, seq($.expr, '|>', $.expr)),
      prec.left(1, seq($.expr, '==', $.expr)),
      prec.left(1, seq($.expr, '!=', $.expr)),
      prec.left(1, seq($.expr, '<', $.expr)),
      prec.left(1, seq($.expr, '<=', $.expr)),
      prec.left(1, seq($.expr, '>', $.expr)),
      prec.left(1, seq($.expr, '>=', $.expr)),
      prec.left(2, seq($.expr, '+', $.expr)),
      prec.left(2, seq($.expr, '-', $.expr)),
      prec.left(3, seq($.expr, '*', $.expr)),
      prec.left(3, seq($.expr, '/', $.expr)),
      prec.left(3, seq($.expr, '%', $.expr)),
    ),

    unary_expr: $ => choice(
      prec(4, seq('-', $.expr)),
      prec(4, seq('&', $.expr)),
    ),

    call_expr: $ => prec(5, seq(
      field('callee', $.expr),
      '(',
      optional($.arg_list),
      ')',
    )),

    index_expr: $ => prec(5, seq(
      field('object', $.expr),
      '[',
      field('index', $.expr),
      ']',
    )),

    field_expr: $ => prec(5, seq(
      field('object', $.expr),
      '.',
      field('field', $.identifier),
    )),

    method_expr: $ => prec(6, seq(
      field('object', $.expr),
      '.',
      field('method', $.identifier),
      '(',
      optional($.arg_list),
      ')',
    )),

    arg_list: $ => seq($.expr, repeat(seq(',', $.expr))),

    primary: $ => choice(
      $.integer,
      $.float,
      $.string,
      $.true,
      $.false,
      $.identifier,
      $.list_literal,
      $.map_literal,
      $.paren_expr,
      $.lambda,
    ),

    paren_expr: $ => seq('(', $.expr, ')'),

    list_literal: $ => seq(
      '[',
      optional(seq($.expr, repeat(seq(',', $.expr)))),
      ']',
    ),

    map_literal: $ => seq(
      '{',
      optional(seq($.map_entry, repeat(seq(',', $.map_entry)))),
      '}',
    ),

    map_entry: $ => seq(
      field('key', $.identifier),
      ':',
      field('value', $.expr),
    ),

    // macro assert_eq(a, b) = if a != b ... end end
    macro_def: $ => seq(
      'macro',
      field('name', $.identifier),
      '(',
      optional($.macro_param_list),
      ')',
      '=',
      field('body', $.block),
      'end',
    ),

    macro_param_list: $ => seq($.identifier, repeat(seq(',', $.identifier))),

    lambda: $ => choice(
      // |params| expr
      seq('|', optional($.param_list), '|', $.expr),
      // do |params| ... end
      seq('do', '|', optional($.param_list), '|', $.block, 'end'),
    ),

    // Terminals
    integer: $ => /[0-9](_?[0-9])*/,
    float: $ => /[0-9](_?[0-9])*\.[0-9](_?[0-9])*/,
    string: $ => seq('"', repeat(choice(/[^"\\]/, seq('\\', /./))), '"'),
    true: $ => 'true',
    false: $ => 'false',
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    comment: $ => seq('#', /[^\n]*/),
  },
});
