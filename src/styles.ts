export const CARD_STYLES = `
  :host { display: block; }

  ha-card {
    padding: 4px 2px;
    box-sizing: border-box;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    color: #888; /* gray */
    font-size: 14px;
  }

  .section-header {
    color: #2196F3; /* Material Blue */
    font-size: 15px;
    padding: 2px 0 2px 0;
    margin-top: 1px;
  }

  .game-row {
    display: flex;
    align-items: center;
    height: 28px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    gap: 0;
    position: relative;
  }

  .team-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 99px;
    min-width: 60px;
    overflow: hidden;
  }
  .team-col-a { text-align: right; padding-right: 3px; }
  .team-col-b { text-align: left;  padding-left: 3px;  }

  .team-name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }
  .team-rank {
    font-size: 9px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
  }

  .logo {
    width: 30px;
    min-width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    overflow: hidden;
  }
  .logo-a { padding-right: 3px; }
  .logo-b { padding-left:  3px; }
  .logo img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    display: block;
  }

  .score {
    width: 34px;
    min-width: 34px;
    font-size: 20px;
    font-weight: bold;
    height: 28px;
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: center;
  }
  .score-a { justify-content: flex-end; }
  .score-b { justify-content: flex-start; }

  .colon {
    width: 9px;
    min-width: 9px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    height: 28px;
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
    font-size: 8px;
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
    font-size: 10px;
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
    font-size: 13px;
    font-weight: bold;
    line-height: 1.1;
    padding-left: 4px;
  }
  .msg-sub {
    font-size: 10px;
    font-weight: normal;
    color: #666; /* dimgray */
    line-height: 1.1;
  }

  .empty {
    padding: 8px 4px;
    font-size: 13px;
    color: #555; /* dark gray */
  }
`;
