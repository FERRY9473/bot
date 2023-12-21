const {
  command,
  isPrivate,
  qrcode,
  Bitly,
  isUrl,
  readQR,
  AItts,
  getJson,
} = require("../../lib/");

const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: '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',
  engine: 'davinci-codex',
});





const { downloadMediaMessage } = require("@whiskeysockets/baileys");
command(
  {
    pattern: "vv",
    fromMe: isPrivate,
    desc: "Forwards The View once messsage",
    type: "tool",
  },
  async (message, match, m) => {
    let buff = await m.quoted.download();
    return await message.sendFile(buff);
  }
);

command (
  {
    pattern: "dalle",
    fromMe: isPrivate,
    desc: "Membuat sebuah gambar dengan AI Dall-e",
    type: "tool",
  },
    async (message, match) => {
    try {
      // tidak perlu diisi apikeynya disini, karena sudah diisi di file key.json
      if (!match) return reply(`Membuat gambar dari AI.\n\nContoh:\n${prefix}${command} Wooden house on snow mountain`);
      const image = await openai.images.generate({ 
        model: "dall-e-2",
        prompt: match, 
        n: 1,
        size: '1024x1024', 
        });
      //console.log(response.data.data[0].url) // see the response
      return await message.sendMessage(message.jid, image.data[0].url, {}, "image");
      // message.sendMessage(from, image.data[0].url, image, mek);
      } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
      console.log(`${error.response.status}\n\n${error.response.data}`);
    } else {
      console.log(error);
      message.reply("Maaf, sepertinya ada yang error :"+ error.message);
    }
  }
  }
);

command(
  {
    pattern: "gpt",
    fromMe: isPrivate,
    desc: "Berbicara dengan AI dari chat GPT",
    type: "tool",
  },
  async (message, match) => {
      try {
        // tidak perlu diisi apikeynya disini, karena sudah diisi di file key.json
        if (!match) return reply(`Chat dengan AI.\n\nContoh:\n${prefix}${command} Apa itu resesi`);
        const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: match }],
          model: 'gpt-3.5-turbo'
        });
      
        await message.reply(chatCompletion.choices[0].message.content);
      } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error);
        message.reply("Maaf, sepertinya ada yang error :"+ error.message);
      }
    }
  }
);


command(
  {
    pattern: "qr",
    fromMe: isPrivate,
    desc: "Read/Write Qr.",
    type: "Tool",
  },
  async (message, match, m) => {
    match = match || (message.reply_message && message.reply_message.text);

    if (match) {
      let buff = await qrcode(match);
      return await message.sendMessage(message.jid, buff, {}, "image");
    } else if (!message.reply_message || !message.reply_message.image) {
      return await message.sendMessage(
        message.jid,
        "*Example : qr test*\n*Reply to a qr image.*"
      );
    }

    const buffer = await downloadMediaMessage(
      message.reply_message,
      "buffer",
      {},
      {
        reuploadRequest: message.client.updateMediaMessage,
      }
    );
    readQR(buffer)
      .then(async (data) => {
        return await message.sendMessage(message.jid, data);
      })
      .catch(async (error) => {
        console.error("Error:", error.message);
        return await message.sendMessage(message.jid, error.message);
      });
  }
);

command(
  {
    pattern: "bitly ?(.*)",
    fromMe: isPrivate,
    desc: "Converts Url to bitly",
    type: "tool",
  },
  async (message, match) => {
    match = match || message.reply_message.text;
    if (!match) return await message.reply("_Reply to a url or enter a url_");
    if (!isUrl(match)) return await message.reply("_Not a url_");
    let short = await Bitly(match);
    return await message.reply(short.link);
  }
);

command(
  {
    pattern: "tts",
    fromMe: true,
    desc: "Convert text to speech",
  },
  async (message, match) => {
    try {
      const text = match || message.reply_message.text;
      if (!text) {
        await message.reply("Please provide the text for TTS.");
        return;
      }
      await AItts(message, text);
    } catch (error) {
      console.error("Error processing TTS command:", error);
    }
  }
);

const API_KEY = "e6d0cd0023b7ee562a97be33d3c5f524";
const BASE_URL = "https://api.musixmatch.com/ws/1.1/";

command(
  {
    pattern: "lyric",
    fromMe: isPrivate,
    desc: "Searches for lyrics based on the format: song;artist",
    type: "tools",
  },
  async (message, match) => {
    const [song, artist] = match.split(";").map((item) => item.trim());
    if (!song || !artist) {
      await message.reply("Search with this format: \n\t_lyric song;artist_");
    } else {
      try {
        let trackId = null;

        const searchUrl = `${BASE_URL}track.search?q_track=${encodeURIComponent(
          song
        )}&q_artist=${encodeURIComponent(
          artist
        )}&f_has_lyrics=1&apikey=${API_KEY}`;
        console.log(searchUrl);
        const searchData = await getJson(searchUrl);

        const trackList = searchData.message.body.track_list;

        if (trackList.length > 0) {
          trackId = trackList[0].track.track_id;
          
        } else {
          const allTracksUrl = `${BASE_URL}track.search?q_artist=${encodeURIComponent(
            artist
          )}&apikey=${API_KEY}`;
          console.log(allTracksUrl);
          const allTracksData = await getJson(allTracksUrl);

          const allTracks = allTracksData.message.body.track_list;

          if (allTracks.length > 0) {
            trackId = allTracks[0].track.track_id;
          }
        }

        if (trackId) {
          const lyricsUrl = `${BASE_URL}track.lyrics.get?track_id=${trackId}&apikey=${API_KEY}`;
          console.log(lyricsUrl);
          const lyricsData = await getJson(lyricsUrl);

          let lyrics = lyricsData.message.body.lyrics.lyrics_body;
          const disclaimer =
            "******* This Lyrics is NOT for Commercial use *******";
          lyrics = lyrics.replace(disclaimer, "");

          const data = {
            artist_name: artist,
            song: song,
            lyrics: lyrics.replace(/\(\d+\)$/, ""),
          };

          return await message.reply(`*Artist:* ${data.artist_name}\n*Song:* ${data.song}\n*Lyrics:*\n${data.lyrics.trim()}
          `);
        } else {
          return await message.reply(
            "No lyrics found for this song by this artist."
          );
        }
      } catch (error) {
        console.error("Error:", error);
        return await message.reply("An error occurred while fetching lyrics.");
      }
    }
  }
);
