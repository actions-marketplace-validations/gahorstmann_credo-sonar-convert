const core = require('@actions/core');
var fs = require('fs');

function severity(item) {
  var result;
  switch (true) {
    case (item >= 20):
      result = "BLOCKER"
      break;
    case (item >= 10):
      result = "CRITICAL"
      break;
    case (item >= 1):
      result = "MAJOR"
      break;
    case (item >= -10):
      result = "MINOR"
      break;
    default:
      result = "INFO"
  }
  return result;
}

function type(item) {
  var result;
  switch (item) {
    case "warnings":
      result = "BUG"
      break;
    case "refactor":
      result = "VULNERABILITY"
      break;
    default:
      result = "CODE_SMELL"
  }
  return result;
}

try {

  const inputfile = core.getInput('input-file');
  const outputfile = core.getInput('output-file');
  const filePath = process.env['GITHUB_WORKSPACE'] || '';

  console.log(`Input: ${inputfile}!`);
  console.log(`Output: ${outputfile}!`);
  
  var json = require(filePath + "/" + inputfile);
  if (json.issues.length > 0) {
    var out = '{ "issues" : ['
    for (var k in json.issues) {
      var credo = json.issues[k];
      if (credo.column) {
        var startColumn = credo.column - 1
        var endColumn = credo.column_end - 1
      } else {
        startColumn = null
        endColumn = null
      }
      var issue = {
        engineId: credo.check,
        ruleId: credo.scope || credo.check,
        severity: severity(credo.priority),
        type: type(credo.category),
        primaryLocation: {
          message: credo.message,
          filePath: credo.filename,
          textRange: {
            startLine: credo.line_no,
            startColumn: startColumn,
            endColumn: endColumn
          }
        }
      }
      var jsonString = JSON.stringify(issue);
      out = out + jsonString + ','
    }
    out = out.slice(0, -1) + ']}'
    var obj = JSON.parse(out);
    console.log(obj)

    fs.writeFile(filePath + "/" + outputfile, out, function (err) {
      if (err) throw err;
      console.log("File " + outputfile + " generated!");
    });
    
  } else {
    fs.copyFile(filePath + "/" + inputfile, filePath + "/" + outputfile, (err) => {
      if (err) throw err;
    });
  }
} catch (error) {
  core.setFailed(error.message);
}