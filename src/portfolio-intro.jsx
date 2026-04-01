import { useState, useEffect, useRef } from 'react';

const names = [
  { text: 'Suk', lang: 'en' },
  { text: '석', lang: 'ko' },
  { text: '石', lang: 'zh' },
  { text: 'そく', lang: 'ja-hira' },
  { text: 'Soku', lang: 'en' },
  { text: 'ソク', lang: 'ja-kata' },
];

const getRandomStartIndex = () => Math.floor(Math.random() * names.length);

const getFontScale = (lang) => 1;
const getYOffset = (lang) => '0';

export default function PortfolioIntro() {
  const startIndexRef = useRef(getRandomStartIndex());
  const startIndex = startIndexRef.current;
  
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [cursorActive, setCursorActive] = useState(true);
  const [phase, setPhase] = useState('waiting');
  const [textA, setTextA] = useState({ index: startIndex, opacity: 1 });
  const [textB, setTextB] = useState({ index: (startIndex + 1) % names.length, opacity: 0 });
  const [visibleIndex, setVisibleIndex] = useState((startIndex + 1) % names.length);
  const [typingOpacity, setTypingOpacity] = useState(1);
  const [showFirstFadeIn, setShowFirstFadeIn] = useState(false);
  
  // Refs for fade cycle
  const activeSlotRef = useRef('A');
  const nextIndexRef = useRef((startIndex + 2) % names.length);
  const textAIndexRef = useRef(startIndex);
  const textBIndexRef = useRef((startIndex + 1) % names.length);

  // Cursor blinking
  useEffect(() => {
    if (!cursorActive) return;
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, [cursorActive]);

  // Wait before typing starts
  useEffect(() => {
    if (phase !== 'waiting') return;
    const waitTimeout = setTimeout(() => setPhase('typing'), 2100);
    return () => clearTimeout(waitTimeout);
  }, [phase]);

  // Typing effect
  useEffect(() => {
    if (phase !== 'typing') return;
    
    const text = names[startIndex].text;
    let charIndex = 1;
    setDisplayText(text.slice(0, 1));
    
    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setCursorActive(false);
        setShowCursor(true);
        
        // Two blinks then transition
        setTimeout(() => {
          setShowCursor(false);
          setTimeout(() => {
            setShowCursor(true);
            setTimeout(() => {
              setShowCursor(false);
              // 100ms wait after cursor off
              setTimeout(() => {
                // Start transition to fading phase
                // Treat typing text as "Slot A", first name goes to "Slot B"
                const firstFadeIndex = (startIndex + 1) % names.length;
                const secondFadeIndex = (startIndex + 2) % names.length;
                
                // Slot A will get second name after transition
                // Slot B has first name and will fade in
                textAIndexRef.current = secondFadeIndex;
                textBIndexRef.current = firstFadeIndex;
                nextIndexRef.current = (startIndex + 3) % names.length;
                activeSlotRef.current = 'B'; // B will be visible after transition
                
                // Set up: typing fades out (like A), first name fades in (like B)
                setTextA({ index: secondFadeIndex, opacity: 0 });
                setTextB({ index: firstFadeIndex, opacity: 0 });
                setVisibleIndex(firstFadeIndex);
                setShowFirstFadeIn(true);
                
                // Crossfade: typing (A) fades out, first name (B) fades in
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setTypingOpacity(0);
                    setTextB({ index: firstFadeIndex, opacity: 1 });
                  });
                });
                
                setTimeout(() => {
                  setPhase('fading');
                }, 1000);
              }, 100);
            }, 530);
          }, 530);
        }, 530);
      }
    }, 180);
    
    return () => clearInterval(typeInterval);
  }, [phase, startIndex]);

  // Fading cycle - alternating between slot A and B
  useEffect(() => {
    if (phase !== 'fading') return;

    let timeoutId;
    
    const runFade = () => {
      const currentSlot = activeSlotRef.current;
      
      // Fade: current slot fades out, other slot fades in
      if (currentSlot === 'A') {
        setTextA(prev => ({ ...prev, opacity: 0 }));
        setTextB(prev => ({ ...prev, opacity: 1 }));
        setVisibleIndex(textBIndexRef.current);
      } else {
        setTextA(prev => ({ ...prev, opacity: 1 }));
        setTextB(prev => ({ ...prev, opacity: 0 }));
        setVisibleIndex(textAIndexRef.current);
      }
      
      // After fade completes, prepare next
      timeoutId = setTimeout(() => {
        const nextContentIndex = nextIndexRef.current;
        nextIndexRef.current = (nextContentIndex + 1) % names.length;
        
        if (currentSlot === 'A') {
          textAIndexRef.current = nextContentIndex;
          setTextA({ index: nextContentIndex, opacity: 0 });
          activeSlotRef.current = 'B';
        } else {
          textBIndexRef.current = nextContentIndex;
          setTextB({ index: nextContentIndex, opacity: 0 });
          activeSlotRef.current = 'A';
        }
        
        // Start next fade
        timeoutId = setTimeout(runFade, 100);
      }, 1000);
    };

    timeoutId = setTimeout(runFade, 100);

    return () => clearTimeout(timeoutId);
  }, [phase]);

  const nameA = names[textA.index];
  const nameB = names[textB.index];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#fafafa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grain texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.03,
        pointerEvents: 'none',
      }} />

      {/* Name Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '12rem',
        width: '100%',
        position: 'relative',
      }}>
        {/* Typing phase */}
        {(phase === 'waiting' || phase === 'typing') && (
          <div style={{
            position: 'absolute',
            fontFamily: '"Noto Sans Mono", "Noto Sans KR", "Noto Sans JP", "Noto Sans SC", monospace',
            fontSize: 'clamp(3rem, 12vw, 8rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            opacity: typingOpacity,
            transition: 'opacity 1s ease',
          }}>
            <span>{displayText}</span>
            <span style={{
              width: '0.5em',
              height: '1em',
              backgroundColor: '#1a1a1a',
              marginLeft: '0.08em',
              opacity: showCursor ? 1 : 0,
            }} />
          </div>
        )}

        {/* First fade-in text (during typing->fading transition) */}
        {showFirstFadeIn && phase === 'typing' && (
          <span style={{
            position: 'absolute',
            fontFamily: '"Noto Sans Mono", "Noto Sans KR", "Noto Sans JP", "Noto Sans SC", monospace',
            fontSize: `calc(clamp(4rem, 15vw, 10rem) * ${getFontScale(nameB.lang)})`,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#1a1a1a',
            lineHeight: 1,
            writingMode: 'horizontal-tb',
            whiteSpace: 'nowrap',
            opacity: textB.opacity,
            transition: 'opacity 1s ease',
          }}>
            {nameB.text}
          </span>
        )}

        {/* Fading phase - Slot A */}
        {phase === 'fading' && (
          <span style={{
            position: 'absolute',
            fontFamily: '"Noto Sans Mono", "Noto Sans KR", "Noto Sans JP", "Noto Sans SC", monospace',
            fontSize: `calc(clamp(4rem, 15vw, 10rem) * ${getFontScale(nameA.lang)})`,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#1a1a1a',
            lineHeight: 1,
            writingMode: 'horizontal-tb',
            whiteSpace: 'nowrap',
            opacity: textA.opacity,
            transition: 'opacity 1s ease-in-out',
          }}>
            {nameA.text}
          </span>
        )}

        {/* Fading phase - Slot B */}
        {phase === 'fading' && (
          <span style={{
            position: 'absolute',
            fontFamily: '"Noto Sans Mono", "Noto Sans KR", "Noto Sans JP", "Noto Sans SC", monospace',
            fontSize: `calc(clamp(4rem, 15vw, 10rem) * ${getFontScale(nameB.lang)})`,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#1a1a1a',
            lineHeight: 1,
            writingMode: 'horizontal-tb',
            whiteSpace: 'nowrap',
            opacity: textB.opacity,
            transition: 'opacity 1s ease-in-out',
          }}>
            {nameB.text}
          </span>
        )}
      </div>

      {/* Progress dots */}
      <div style={{
        position: 'absolute',
        bottom: '3rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.8rem',
        opacity: phase === 'fading' ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}>
        {names.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: idx === visibleIndex ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: idx === visibleIndex ? '#1a1a1a' : '#ddd',
              transition: 'all 0.4s ease',
            }}
          />
        ))}
      </div>

      {/* Corner text */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '2rem',
        fontFamily: '"Noto Sans Mono", "Noto Sans KR", "Noto Sans JP", "Noto Sans SC", monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#bbb',
      }}>
        Portfolio / 2025
      </div>

      <link 
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@300;400;500;600&family=Noto+Sans+KR:wght@400;500&family=Noto+Sans+JP:wght@400;500&family=Noto+Sans+SC:wght@400;500&display=swap" 
        rel="stylesheet" 
      />
    </div>
  );
}
