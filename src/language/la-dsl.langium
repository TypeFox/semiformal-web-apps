grammar LaDsl

entry Model:
    ("stack" '=' '[' 
        (techstack+=STRING ("," techstack+=STRING )*)']'
    )? 
    (
        entities+=Entity | 
        components+=Component | 
        controllers+=Controller | 
        roles+=Role | 
        pages+=Page
    )*;

/**
 * An entity, translates to a table in the database for example, 
 * or an object in a NoSQL database. An entity can reference another
 * entity as a type -> a foreign key
 */
Entity:
    'entity' name=ID '{' attributes+=EntityAttribute* '}';

/**
 * A component, translates to a reusable UI component, for example React Component
 */
Component:
    'component' name=ID '{' attributes+=ComponentAttribute* '}';

/**
 * A controller, translates to a route/controller in the backend,
 * it may apply queries, filters, permissions, role checks, etc.
 */
Controller: 
    'action' name=ID '{' attributes+=ActionAttribute* '}';

/**
 * A role, differentiates between different types of users
 * Roles are primarlily used for Controllers/UI to display different content
 * based on the user's role
 */
Role:
    'role' name=ID;

/**
 * An attribute of an entity, for example a column in the database
 * presence of `private` keyword indicates that the attribute is not 
 * supposed to be returned by the API, such as a password field.
 */
EntityAttribute:
    (isPrivate?="private")? name=ID ':' (type=[Entity:ID] | builtinType=BuiltinEntityType) (isArray+='[]')*;

/**
 * An attribute of a component: a property of a UI component
 * A UI attribute could be a description (string), an display of an entity (entity), 
 * or a built-in type such as ui::input.
 */
ComponentAttribute:
    name=ID ':' (((
        (type=[ComponentUsabeType:ID] | builtinType=BuiltinEntityType | UIComponent) |
        ('{' attributes+=ComponentAttribute* '}')
    ) (isArray+='[]')*) | STRING) ;

/**
 * A component attribute type could be an entity or a component
 */
ComponentUsabeType:
    Component | Entity;

/**
 * A page, is a Root Component, that is a page in the frontend
 */
Page:
    // create a page from a set of components
    'page' name=ID '{' attributes+=ComponentAttribute* '}' |
    // create a page from a single component
    'page' name=ID '=' component=[Component:ID];

/**
 * An attribute of a controller: a parameter of a controller action
 * - when the value is route, it indicates the route of the controller
 * - when the value is method, it indicates the HTTP method of the controller
 * - when the value is returns, it indicates the return expression of the controller
 */
ActionAttribute:
    recommendedAttribute=("route" | "method") ':' value=STRING |
    name=ID ':' value=STRING |
    "returns" ':' value=STRING;

/**
 * A builtin entity type
 */
BuiltinEntityType returns string:
    'String' | 'number' | 'boolean' | 'datetime';

/**
 * A UI component
 */
fragment UIComponent:
    'ui' '::' htmlComponent=('input' | 'button' | 'select' | 'textarea' | 'modal');

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
