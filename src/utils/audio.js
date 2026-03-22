// ═══ TTS — static pre-generated files, fallback to /api/tts proxy ═══
export let _ttsAudio = null;

export const setTtsAudio = (val) => { _ttsAudio = val; };

const _isKana=(ch)=>/^[\u3040-\u30FF]$/.test(ch);

export const _playAudio=(src,rate=1,onEnd=null,onErr=null)=>{
  if(_ttsAudio){_ttsAudio.pause();_ttsAudio=null;}
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  const a=new Audio(src); a.playbackRate=rate; _ttsAudio=a;
  if(onEnd) a.onended=onEnd;
  if(onErr) a.onerror=onErr;
  return a.play();
};

export const speak = (text, lang="ja-JP") => {
  // All Japanese -> Google Translate proxy (natural pronunciation)
  const ttsLang=lang==="ja-JP"?"ja":"en";
  _playAudio(`/api/tts?lang=${ttsLang}&q=${encodeURIComponent(text)}`,lang==="ja-JP"?0.85:1).catch(()=>{
    if(!window.speechSynthesis) return;
    const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate=0.85;
    window.speechSynthesis.speak(u);
  });
};

export const speakPhrase=(id,text)=>{
  _playAudio(`/audio/phrase/${id}.mp3`,1).catch(()=>{
    _playAudio(`/api/tts?lang=ja&q=${encodeURIComponent(text)}`,0.85).catch(()=>{});
  });
};
