import styles from "../../styles/Studio.module.css";

// Renders the block structure lib/studio/library.js produces. Links only ever
// come from the parser's allow-list; outside links open in a new tab.
const isExternal = (href) => /^https?:\/\//.test(href);

export function Spans({ spans }) {
  return spans.map((span, index) => {
    if (span.t === "link") {
      return isExternal(span.href) ? (
        <a key={index} href={span.href} target="_blank" rel="noopener noreferrer">
          {span.v}
          <span className={styles.visuallyHidden}> (opens in a new tab)</span>
        </a>
      ) : (
        <a key={index} href={span.href}>
          {span.v}
        </a>
      );
    }
    if (span.t === "strong") return <strong key={index}>{span.v}</strong>;
    if (span.t === "em") return <em key={index}>{span.v}</em>;
    if (span.t === "code") return <code key={index}>{span.v}</code>;
    return <span key={index}>{span.v}</span>;
  });
}

export function Blocks({ blocks, headingBase = 3 }) {
  return blocks.map((block, index) => {
    switch (block.type) {
      case "h": {
        const level = Math.min(6, headingBase + block.level - 1);
        const Tag = `h${level}`;
        return (
          <Tag key={index} className={styles.proseHeading}>
            <Spans spans={block.spans} />
          </Tag>
        );
      }
      case "meta":
        return (
          <p key={index} className={styles.proseMeta}>
            {block.items.join(" · ")}
          </p>
        );
      case "quote":
        return (
          <blockquote key={index} className={styles.proseQuote}>
            <Spans spans={block.spans} />
          </blockquote>
        );
      case "list": {
        const Tag = block.ordered ? "ol" : "ul";
        return (
          <Tag key={index} className={styles.proseList}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Spans spans={item} />
              </li>
            ))}
          </Tag>
        );
      }
      case "code":
        return (
          <pre key={index} className={styles.proseCode}>
            <code>{block.text}</code>
          </pre>
        );
      case "table":
        return (
          <div key={index} className={styles.proseTableWrap}>
            <table className={styles.proseTable}>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) =>
                      rowIndex === 0 ? (
                        <th key={cellIndex} scope="col">
                          <Spans spans={cell} />
                        </th>
                      ) : (
                        <td key={cellIndex}>
                          <Spans spans={cell} />
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "rule":
        return <hr key={index} className={styles.proseRule} />;
      default:
        return (
          <p key={index}>
            <Spans spans={block.spans} />
          </p>
        );
    }
  });
}

export function ExternalLink({ href, children, className }) {
  const external = isExternal(href);
  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
      {external && <span aria-hidden="true"> ↗</span>}
      {external && <span className={styles.visuallyHidden}> (opens in a new tab)</span>}
    </a>
  );
}
