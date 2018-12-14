
exports.json_response_handler = function(resolve, reject) {
  return (response) => {
    let all_data = "";
    response.on('error', reject);
    response.on('data', (data) => all_data += data);
    response.on('end', () => {
      try {
        let parsed = JSON.parse(all_data);
        if (response.statusCode < 200 || response.statusCode > 299) reject(parsed);
        else resolve(parsed);
      } catch (e) {
        reject(all_data);
      }
    });
  };
}