import { parse, format } from 'url';
import readline from 'readline';
import process from 'process';

function main(client_id: string) {
  let url = format({
    protocol: "https",
    hostname: "accounts.spotify.com",
    pathname: "/authorize",
    query: {
      client_id: client_id,
      response_type: "code",
      redirect_uri: "http://localhost:8080/spotback_auth/",
      scope: "playlist-read-private playlist-modify-private"
    }
  });

  let term = readline.createInterface({
    input: process.stdin, output: process.stdout
  });
  term.question(`Go to ${url}\n`, function (res) {
    let url = parse(res, true);
    console.log(url);
    let code = url.query.code;

    console.log(`Please save this code ${code}`);
  });
}

if (require.main === module) {
  main();
}