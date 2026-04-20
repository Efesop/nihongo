// ═══ TTS — static pre-generated files, fallback to /api/tts proxy ═══
export let _ttsAudio = null;
// Monotonic token: every new playback increments this. Callbacks from older
// calls (e.g. chained English→Japanese) compare against it and abort if stale.
// Fixes race where a user-initiated click mid-sequence got stomped by the
// previous sequence's pending onended handler.
let _playToken = 0;
export const _newPlayToken = () => ++_playToken;
export const _isCurrentToken = (t) => t === _playToken;

export const setTtsAudio = (val) => { _ttsAudio = val; };

const _isKana=(ch)=>/^[\u3040-\u30FF]$/.test(ch);

export const _playAudio=(src,rate=1,onEnd=null,onErr=null)=>{
  if(_ttsAudio){_ttsAudio.pause();_ttsAudio.src="";_ttsAudio=null;}
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  _newPlayToken();
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

export const speakPhrase=(id,text,{slow=false}={})=>{
  // If slow requested and pre-recorded slow file exists, use it (no playbackRate hack needed)
  if(slow){
    _playAudio(`/audio/phrase-slow/${id}.mp3`,1).catch(()=>{
      // Fallback: normal file at reduced speed
      _playAudio(`/audio/phrase/${id}.mp3`,0.7).catch(()=>{
        _playAudio(`/api/tts?lang=ja&q=${encodeURIComponent(text)}`,0.65).catch(()=>{});
      });
    });
    return;
  }
  _playAudio(`/audio/phrase/${id}.mp3`,1).catch(()=>{
    _playAudio(`/api/tts?lang=ja&q=${encodeURIComponent(text)}`,0.75).catch(()=>{});
  });
};

// English → pause → Japanese chain for phrase learning.
// Uses a play token so that if the user clicks another play button mid-chain,
// the pending Japanese playback is cancelled instead of stomping their new audio.
export const speakPhraseWithEnglish=(id,japanese,english)=>{
  if(_ttsAudio){_ttsAudio.pause();_ttsAudio.src="";_ttsAudio=null;}
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  const token=_newPlayToken();
  const playJp=()=>{
    if(!_isCurrentToken(token)) return; // user started something else — abort
    const jpUrl=`/audio/phrase/${id}.mp3`;
    const a2=new Audio(jpUrl);a2.playbackRate=1;_ttsAudio=a2;
    a2.onerror=()=>{
      if(!_isCurrentToken(token)) return;
      const a3=new Audio(`/api/tts?lang=ja&q=${encodeURIComponent(japanese)}`);
      a3.playbackRate=0.85;_ttsAudio=a3;a3.play().catch(()=>{});
    };
    a2.play().catch(()=>{});
  };
  // Play English first via Google TTS, then Japanese after
  const enUrl=`/api/tts?lang=en&q=${encodeURIComponent(english)}`;
  const a1=new Audio(enUrl);a1.playbackRate=1;_ttsAudio=a1;
  a1.onended=()=>{ if(_isCurrentToken(token)) setTimeout(()=>{ if(_isCurrentToken(token)) playJp(); },150); };
  // If English fails (TTS down), still play Japanese
  a1.onerror=()=>{ playJp(); };
  a1.play().catch(()=>{ playJp(); });
};

// Play a simple two-part narration: English explanation, then Japanese example.
// Used by grammar-insight cards. Pre-recorded MP3s expected at the given paths;
// falls back to Google TTS proxy if files missing.
export const speakGrammarExplain=(patternId,enText,jaText)=>{
  if(_ttsAudio){_ttsAudio.pause();_ttsAudio.src="";_ttsAudio=null;}
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  const token=_newPlayToken();
  const playJp=()=>{
    if(!_isCurrentToken(token)) return;
    if(!jaText) return;
    const a=new Audio(`/audio/grammar/${patternId}-ja.mp3`);
    a.playbackRate=1;_ttsAudio=a;
    a.onerror=()=>{
      if(!_isCurrentToken(token)) return;
      const b=new Audio(`/api/tts?lang=ja&q=${encodeURIComponent(jaText)}`);
      b.playbackRate=0.9;_ttsAudio=b;b.play().catch(()=>{});
    };
    a.play().catch(()=>{});
  };
  const enUrl=`/audio/grammar/${patternId}-en.mp3`;
  const a1=new Audio(enUrl);a1.playbackRate=1;_ttsAudio=a1;
  a1.onended=()=>{ if(_isCurrentToken(token)) setTimeout(()=>{ if(_isCurrentToken(token)) playJp(); },250); };
  a1.onerror=()=>{
    // No pre-recorded file — fall back to Google TTS EN then JP
    if(!_isCurrentToken(token)) return;
    const b=new Audio(`/api/tts?lang=en&q=${encodeURIComponent(enText)}`);
    b.playbackRate=1;_ttsAudio=b;
    b.onended=()=>{ if(_isCurrentToken(token)) setTimeout(()=>{ if(_isCurrentToken(token)) playJp(); },250); };
    b.play().catch(()=>{});
  };
  a1.play().catch(()=>{});
};
