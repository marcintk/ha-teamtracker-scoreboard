export const CARD_STYLES = `
  :host { display: block; }

  ha-card {
    padding: 4px 2px;
    box-sizing: border-box;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    color: #888; /* gray */
    font-size: calc(14px * var(--scoreboard-font-scale, 1));
  }

  .section-header {
    color: #2196F3; /* Material Blue */
    font-size: calc(15px * var(--scoreboard-font-scale, 1));
    padding: 2px 0 2px 0;
    margin-top: 1px;
  }

  .game-row {
    display: flex;
    align-items: center;
    height: var(--scoreboard-row-height, 28px);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    gap: 0;
    position: relative;
  }

  .team-pos {
    display: var(--scoreboard-position-display, block);
    width: 18px;
    min-width: 18px;
    font-size: calc(11px * var(--scoreboard-font-scale, 1));
    font-variant-numeric: tabular-nums;
    text-align: center;
    color: var(--scoreboard-opponent-color, #777);
    overflow: hidden;
  }

  .team-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }
  .team-col-a {
    text-align: right; padding-right: 3px;
    width: var(--scoreboard-team-col-a-width, var(--scoreboard-team-col-width, 99px));
    min-width: var(--scoreboard-team-col-a-width, var(--scoreboard-team-col-width, 99px));
  }
  .team-col-b {
    text-align: left; padding-left: 3px;
    width: var(--scoreboard-team-col-b-width, var(--scoreboard-team-col-width, 99px));
    min-width: var(--scoreboard-team-col-b-width, var(--scoreboard-team-col-width, 99px));
  }

  .team-name {
    font-size: calc(13px * var(--scoreboard-font-scale, 1));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }
  .team-rank {
    font-size: calc(9px * var(--scoreboard-font-scale, 1));
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
  }

  .logo {
    width: var(--scoreboard-logo-width, 30px);
    min-width: var(--scoreboard-logo-width, 30px);
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--scoreboard-row-height, 28px);
    overflow: hidden;
  }
  .logo-a { padding-right: 3px; }
  .logo-b { padding-left:  3px; }
  .logo img {
    width: var(--scoreboard-logo-width, 28px);
    height: var(--scoreboard-row-height, 28px);
    object-fit: contain;
    display: block;
  }

  .score {
    width: var(--scoreboard-score-width, 34px);
    min-width: var(--scoreboard-score-width, 34px);
    font-size: calc(20px * var(--scoreboard-font-scale, 1));
    font-weight: bold;
    height: var(--scoreboard-row-height, 28px);
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: center;
  }
  .score-a { justify-content: flex-end; }
  .score-b { justify-content: flex-start; }

  .colon {
    width: var(--scoreboard-colon-width, 9px);
    min-width: var(--scoreboard-colon-width, 9px);
    font-size: calc(17px * var(--scoreboard-font-scale, 1));
    font-weight: bold;
    text-align: center;
    height: var(--scoreboard-row-height, 28px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tv {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 0;
  }
  .tv-badge {
    font-size: calc(8px * var(--scoreboard-font-scale, 1));
    font-weight: bold;
    color: white;
    border-radius: 3px;
    padding: 1px 2px;
    white-space: nowrap;
  }
  .tv-tooltip {
    position: relative;
    cursor: default;
  }
  .tv-tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    font-size: calc(10px * var(--scoreboard-font-scale, 1));
    font-weight: bold;
    padding: 3px 6px;
    border-radius: 4px;
    white-space: pre-wrap;
    width: max-content;
    max-width: 300px;
    text-align: left;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 10;
  }
  .tv-tooltip:hover::after {
    opacity: 1;
  }

  .message {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: calc(13px * var(--scoreboard-font-scale, 1));
    font-weight: bold;
    line-height: 1.1;
    padding-left: 4px;
  }
  .msg-sub {
    font-size: calc(10px * var(--scoreboard-font-scale, 1));
    font-weight: normal;
    color: #666; /* dimgray */
    line-height: 1.1;
  }

  .empty {
    padding: 8px 4px;
    font-size: calc(13px * var(--scoreboard-font-scale, 1));
    color: #555; /* dark gray */
  }

  @keyframes score-flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .score-fresh {
    animation: score-flash 0.5s ease-in-out infinite;
  }
`;
