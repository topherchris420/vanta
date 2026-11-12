import { useEffect, useRef, useState } from "react";
import styles from "../../../styles/Studio.module.css";

// The terminal window. All it can do is what lib/studio/terminal.js allows:
// print from the portfolio's own tree and ask the desktop for an effect.
export default function TerminalApp({ terminal, onEffect, active }) {
  const [state, setState] = useState(terminal.initialState);
  const [lines, setLines] = useState(terminal.banner);
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (active) inputRef.current?.focus({ preventScroll: true });
  }, [active]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const run = (command) => {
    const result = terminal.execute(state, command);
    setState(result.state);
    setLines((previous) => (result.clear ? [] : [...previous, ...result.output].slice(-500)));
    setInput("");
    setCursor(null);
    result.effects.forEach(onEffect);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const { history } = state;
      if (!history.length) return;
      event.preventDefault();
      const next =
        event.key === "ArrowUp"
          ? cursor === null
            ? history.length - 1
            : Math.max(cursor - 1, 0)
          : cursor === null
            ? null
            : cursor + 1 >= history.length
              ? null
              : cursor + 1;
      setCursor(next);
      setInput(next === null ? "" : history[next]);
    } else if (event.key === "Tab") {
      event.preventDefault();
      const options = terminal.complete(state, input);
      if (options.length === 1) {
        const parts = input.split(/\s+/);
        parts[parts.length - 1] = options[0];
        setInput(parts.join(" ") + (parts.length === 1 ? " " : ""));
      } else if (options.length > 1) {
        setLines((previous) => [...previous, { text: options.join("   "), kind: "note" }]);
      }
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className={styles.terminal} onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div ref={logRef} className={styles.terminalLog} role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((line, index) => (
          <div key={index} className={styles.terminalLine} data-kind={line.kind}>
            {line.text || " "}
          </div>
        ))}
      </div>
      <form
        className={styles.terminalForm}
        onSubmit={(event) => {
          event.preventDefault();
          run(input);
        }}
      >
        <label htmlFor="terminal-input" className={styles.terminalPrompt}>
          <span className={styles.visuallyHidden}>Command, in </span>
          {state.cwd} $
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          className={styles.terminalInput}
          value={input}
          maxLength={240}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </form>
    </div>
  );
}
