const backupper = require('./backupper');
const { env } = require('process');

exports.aws_main = async function aws_main(event, context) {
  console.log(event);
  //await backupper.main();
}

if (require.main === module) {
  let date = new Date(Date.now());
  let date_fmt = `${date.getUTCFullYear()}-${zeroPad(date.getUTCMonth() + 1)}-${zeroPad(date.getUTCDate())}`;

  backupper.main(date_fmt, env);
}