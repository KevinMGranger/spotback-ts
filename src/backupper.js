const { request, get } = require('https');
const { parse } = require('url');
const { json_response_handler } = require('./utils');

function is_disover_weekly(playlist) {
  return playlist.owner.id === "spotify" && playlist.name === "Discover Weekly";
}


class SpotifyClient {
  constructor(current_date, client_id, client_secret, auth_token = null) {
    this.playlist_name = `DW ${current_date}`;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.auth_token = `Bearer ${auth_token}`;
  }

  get(url) {
    let opts = parse(url);
    opts.headers = { Authorization: this.auth_token };

    return new Promise((resolve, reject) => {
      get(opts, json_response_handler(resolve, reject)).on('error', reject);
    });
  }

  create() {
    let opts = {
      hostname: "api.spotify.com",
      path: "/v1/me/playlists",
      method: "POST",
      headers: {
        Authorization: this.auth_token,
        "Content-Type": "application/json"
      }
    };
    return new Promise((resolve, reject) => {
      let req = request(opts, json_response_handler(resolve, reject));

      req.on('error', reject);
      req.write(JSON.stringify({
        name: this.playlist_name,
        public: false
      }));
      req.end();
    }).then(res => res.tracks.href);
  }

  tracks_for(href) {
    let opts = parse(href);
    opts.query = Object.assign(opts.query || {}, {
      fields: "items(track(uri))",
      limit: 30
    });
    opts.headers = {
      Authorization: this.auth_token,
      "Content-Type": "application/json"
    };
    return new Promise((resolve, reject) => {
      get(opts, json_response_handler(resolve, reject)).on('error', reject);
    }).then(res => res.items.map(x => x.track.uri));
  }

  add_tracks(tracklist, target) {
    let opts = Object.assign(parse(target), {
      method: "POST",
      headers: {
        Authorization: this.auth_token,
        "Content-Type": "application/json"
      }
    });

    return new Promise((resolve, reject) => {
      let req = request(opts, json_response_handler(resolve, reject));
      req.on('error', reject);
      req.write(JSON.stringify({ uris: tracklist }));
      req.end();
    });
  }

  // returns [discover_weekly] or [discover_weekly, existing_week], where those are URLs for the tracks
  async relevant_playlists() {
    let fields = "&fields=items(name,owner(id),tracks.href)";

    let dw = undefined;
    let current_playlist = undefined;

    let request = this.get(`https://api.spotify.com/v1/me/playlists?limit=50${fields}`);

    while (true) {
      let response = await request;

      if (!dw) {
        dw = response.items.find(is_disover_weekly);
      }
      if (!current_playlist) {
        current_playlist = response.items.find((playlist) => playlist.name === this.playlist_name);
      }

      if (dw && current_playlist) {
        return [dw.tracks.href, current_playlist.tracks.href];
      } else if (response.next && (!dw || !current_playlist)) {
        request = this.get(response.next + fields);
      } else if (!response.next && dw && !current_playlist) {
        return [dw.tracks.href];
      } else if (!response.next && !dw) {
        throw new Error("couldn't find discover weekly playlist");
      }
    }
  }
}

function zeroPad(num) {
  return ("0" + num).slice(-2);
}

exports.main = async function(date_fmt, creds_src) {
  let client = new SpotifyClient(date_fmt, creds_src.CLIENT_ID, creds_src.CLIENT_SECRET, creds_src.AUTH_TOKEN);
  try {
    let [dw, current_playlist] = await client.relevant_playlists();

    if (!current_playlist) current_playlist = client.create();

    let dw_tracks_req = client.tracks_for(dw);

    let [dw_tracks, current_tracks] = await Promise.all([dw_tracks_req, current_playlist]);

    let result = await client.add_tracks(dw_tracks, current_tracks);
    console.log(result);
  } catch (e) {
    console.error(e);
  }
}
