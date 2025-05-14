const fs = require('fs');

// Read the ABI JSON file
fs.readFile('assetdao_abi.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  try {
    // Parse the JSON data
    const jsonData = JSON.parse(data);
    
    // Extract the ABI from the result field
    const abiString = jsonData.result;
    
    // Parse the ABI JSON string
    const abi = JSON.parse(abiString);
    
    // Extract function names and types
    const functions = abi
      .filter(item => item.type === 'function')
      .map(func => ({
        name: func.name,
        type: func.stateMutability,
        inputs: func.inputs.map(input => input.type).join(','),
        outputs: func.outputs ? func.outputs.map(output => output.type).join(',') : ''
      }));
    
    // Log functions grouped by type (view vs non-view)
    console.log('--- VIEW FUNCTIONS ---');
    const viewFunctions = functions.filter(f => f.type === 'view');
    viewFunctions.forEach(f => {
      console.log(`${f.name}(${f.inputs}) => ${f.outputs}`);
    });
    
    console.log('\n--- NON-VIEW FUNCTIONS ---');
    const nonViewFunctions = functions.filter(f => f.type !== 'view');
    nonViewFunctions.forEach(f => {
      console.log(`${f.name}(${f.inputs}) => ${f.outputs}`);
    });
    
    // Log function names for comparison
    console.log('\n--- ALL FUNCTION NAMES ---');
    console.log(functions.map(f => f.name).sort().join('\n'));
    
  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});
