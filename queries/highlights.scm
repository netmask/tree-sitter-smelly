; Keywords
[
  "fn"
  "end"
  "if"
  "then"
  "else"
  "while"
  "do"
  "match"
  "const"
  "region"
  "macro"
  "module"
  "import"
  "extern"
  "type"
  "yield"
  "receive"
] @keyword

; Booleans (named nodes, not anonymous keywords)
(true) @boolean
(false) @boolean

; Function definitions
(fn_def
  name: (identifier) @function.definition)

(extern_fn
  name: (identifier) @function.definition)

(macro_def
  name: (identifier) @function.definition)

; Function calls
(call_expr
  callee: (identifier) @function)

; Method calls
(method_expr
  method: (identifier) @function.method)

; Field access
(field_expr
  field: (identifier) @property)

; Types
(primitive_type) @type.builtin

(named_type
  (identifier) @type)

(type_def
  name: (identifier) @type.definition)

(ref_type
  "&" @operator)

; Type annotations in patterns
(type_pattern
  type_name: (primitive_type) @type.builtin)

; Parameters
(param
  name: (identifier) @variable.parameter
  type: (_) @type)

; Constants
(const_decl
  name: (identifier) @constant)

; Module
(module_decl
  name: (identifier) @module)

; Strings
(string) @string

; Numbers
(integer) @number
(float) @number

; Comments
(comment) @comment

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "|>"
  "="
  "->"
] @operator

; Punctuation
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," "." ":" "|"] @punctuation.delimiter

; Region names
(region_stmt
  name: (identifier) @variable.special)

; Lambda
(lambda "|" @punctuation.delimiter)
(lambda "do" @keyword)

; Block calls (test macros, etc.)
(block_call
  name: (identifier) @function.macro)

; Map keys
(map_entry
  key: (identifier) @property)

(map_pattern_entry
  key: (identifier) @property)

; Import paths
(import_stmt
  path: (string) @string.special)

; Identifiers (fallback)
(identifier) @variable
