'use strict';

// We use the fs and path modules to read files from the current directory, namely:
//  -- for5.ohm, the grammar extension to ES5
//  -- for5-example.js, an example program that uses our grammar extension
//
var fs = require('fs');
var path = require('path');

// The module './es5.js' contains the extensible ES5 grammar we will be using.
// The 'ohm' package is the heart of the extensible parsing system.
//
var ohm = require('ohm-js');
var ES5 = require('ohm-js/examples/ecmascript/es5.js');

// We load our grammar in a context where there is already a grammar
// called "ES5" that is available for extension. We then define an
// extension to the semantic functions associated with the ES5
// grammar. We will add our syntax transformation code to the new
// extension object.
//
var grammar = ohm.grammar(fs.readFileSync(path.join(__dirname, 'for5.ohm')).toString(),
			  { ES5: ES5.grammar });
var semantics = grammar.extendSemantics(ES5.semantics);

// This simple utility generates "probably unique" symbols, for use in
// expanded code.
//
var gensym_start = Math.floor(new Date() * 1);
var gensym_counter = 0;
function gensym() {
  return '_g' + gensym_start + '_' + (gensym_counter++);
}

// This is our enhanced semantic function. Our grammar extension in
// for5.ohm adds new kinds of IterationStatement and calls them the
// "for5_nameless" and "for5_named" variants. In our
// modifiedSourceActions object, if we want to expand the new
// variants, we must write handlers for them, overriding the default
// behaviour, which is simply to write them out as they appeared in
// the original source.
//
var modifiedSourceActions = {
  // These functions compute the expanded ES5 source for our new
  // iteration statements. We recursively expand the source code of
  // the body by reading its "asES5" property. The parameters to the
  // functions correspond to the elements of the respective syntactic
  // rules in "for5.ohm".
  //
  IterationStatement_for5_nameless: function(_for, _five, body) {
    var c = gensym();
    return 'for (var '+c+' = 0; '+c+' < 5; '+c+'++) ' + body.asES5;
  },
  IterationStatement_for5_named: function(_for, _five, _as, id, body) {
    var c = id.asES5;
    return 'for (var '+c+' = 0; '+c+' < 5; '+c+'++) ' + body.asES5;
  }
};

// This is where we hook our modifiedSourceActions object in to extend
// the default "modifiedSource" property inherited from the ES5
// grammar.
//
semantics.extendAttribute('modifiedSource', modifiedSourceActions);

// Finally, we read in an example program, parse it, and check the
// results. If there was a parse error, we print the error message;
// otherwise, we ask for the expanded source code and print it out.
//
var inputSource = fs.readFileSync(path.join(__dirname, 'for5-example.js')).toString();
var parseResult = grammar.match(inputSource);
if (parseResult.succeeded()) {
  console.log(semantics(parseResult).asES5);
} else {
  console.log(parseResult.message);
}
