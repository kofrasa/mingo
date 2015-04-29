var fs = require('fs'),
  JSON = require('JSON');


exports.gradesSimple = JSON.parse(fs.readFileSync(__dirname + '/data/grades_simple.json'));
exports.gradesComplex = JSON.parse(fs.readFileSync(__dirname + '/data/grades_complex.json'));
exports.students = JSON.parse(fs.readFileSync(__dirname + '/data/students.json'));