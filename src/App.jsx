import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightIcon, ClockIcon } from './icons.jsx';
import RoadtripScene from './RoadtripScene.jsx';
import { navLabels, stops } from './content.jsx';

function StoryCard({ stop, visible }) {
  const cardClasses = ['story-card', visible ? 'visible' : ''].filter(Boolean).join(' ');
  const cardStyle = {
    ...(stop.centered ? { textAlign: 'center' } : {}),
    ...(stop.wide ? { maxWidth: '480px' } : {}),
    ...(stop.compact ? { maxWidth: '460px' } : {}),
  };

  return (
    <div className={cardClasses} style={cardStyle}>
      <div className="card-eyebrow" style={stop.centered ? { justifyContent: 'center' } : undefined}>
        {stop.eyebrow}
      </div>
      <h2 className="card-title" style={stop.wide ? { fontSize: '2rem' } : stop.compact ? { fontSize: '1.8rem' } : undefined}>
        {stop.title}
      </h2>
      <p className="card-body" style={stop.compact ? { fontSize: '0.9rem' } : undefined}>{stop.body}</p>
      <div className="card-tags" style={stop.centered ? { justifyContent: 'center' } : undefined}>
        {stop.tags.map((tag) => (
          <span className={tag.accent ? 'tag accent' : 'tag'} key={tag.label}>
            {tag.label}
          </span>
        ))}
      </div>
      {stop.odometer && (
        <div className="odometer">
          <ClockIcon />
          {stop.odometer}
        </div>
      )}
    </div>
  );
}

function Intro({ started, onStart }) {
  return (
    <div id="intro" className={started ? 'gone' : undefined}>
      <h1>Taking<br /><em>the scenic route.</em></h1>
      <p>A California road trip through the career and life of [Your Name] - buckle up, the Odyssey's gassed up.</p>
      <button id="start-btn" type="button" onClick={onStart}>
        <ArrowRightIcon />
        Hit the road
      </button>
    </div>
  );
}

function ScrollHint({ started }) {
  return (
    <div className={started ? 'scroll-hint show' : 'scroll-hint'} id="scroll-hint">
      <div className="scroll-arrow" />
      <span>scroll</span>
    </div>
  );
}

function NavDots({ activeIndex, started, onJump }) {
  return (
    <div id="nav-dots" className={started ? 'show' : undefined}>
      {navLabels.map((label, index) => (
        <button
          aria-label={label}
          className={index === activeIndex ? 'nav-dot active' : 'nav-dot'}
          data-label={label}
          key={label}
          onClick={() => onJump(index)}
          type="button"
        />
      ))}
    </div>
  );
}

function FinalSection() {
  return (
    <div id="final-section">
      <h2>Pull over &amp;<br /><em>say hello.</em></h2>
      <p>Whether you've got a collab in mind, a question, or just want to talk road trips - the passenger seat is always open.</p>
      <div className="cta-links">
        <a href="mailto:you@example.com" className="cta-btn primary">Get in touch</a>
        <a href="#" className="cta-btn secondary">LinkedIn</a>
        <a href="#" className="cta-btn secondary">Resume</a>
      </div>
      <p className="footer-note">(c) [Your Name] - Built with too much coffee and not enough sleep - PCH forever</p>
    </div>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawProgress, setRawProgress] = useState(0);
  const [visibleCards, setVisibleCards] = useState(() => new Set());
  const sectionRefs = useRef([]);
  const driverRef = useRef(null);
  const startedRef = useRef(false);

  const activeIndex = useMemo(() => (
    Math.min(Math.floor(progress * stops.length), stops.length - 1)
  ), [progress]);

  const startJourney = () => {
    startedRef.current = true;
    setStarted(true);
    window.scrollTo({ top: 1, behavior: 'smooth' });
  };

  const jumpTo = (index) => {
    const section = sectionRefs.current[index];
    if (!section) return;

    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    const onScroll = () => {
      if (!startedRef.current) return;

      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const driver = driverRef.current;
      if (!driver || maxScroll <= 0) return;

      const driverHeight = driver.offsetHeight;
      const driverTop = driver.offsetTop;
      const nextProgress = Math.max(0, Math.min(1, (scrollTop - driverTop) / (driverHeight - window.innerHeight)));
      setProgress(nextProgress);
      setRawProgress(scrollTop / maxScroll);

      setVisibleCards((previous) => {
        const next = new Set(previous);
        sectionRefs.current.forEach((section, index) => {
          if (!section) return;
          const rect = section.getBoundingClientRect();
          const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
          if (inView) next.add(index);
        });
        return next;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <Intro started={started} onStart={startJourney} />
      <ScrollHint started={started} />
      <div id="progress-bar" style={{ width: `${rawProgress * 100}%` }} />
      <NavDots activeIndex={activeIndex} started={started} onJump={jumpTo} />
      <RoadtripScene progress={progress} />

      <div id="scroll-driver" ref={driverRef}>
        {stops.map((stop, index) => (
          <section
            className={stop.centered ? 'scroll-section centered-section' : 'scroll-section'}
            id={`section-${index}`}
            key={stop.eyebrow}
            ref={(element) => {
              sectionRefs.current[index] = element;
            }}
          >
            <StoryCard stop={stop} visible={visibleCards.has(index)} />
          </section>
        ))}
      </div>

      <FinalSection />
    </>
  );
}
