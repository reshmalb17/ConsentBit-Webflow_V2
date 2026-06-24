import React from "react";

function MSym({ name, size = 18, fill = 0, style, ...rest }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{ fontSize: size, fontVariationSettings: `'opsz' ${size <= 18 ? 20 : 24}, 'FILL' ${fill}`, ...style }}
      {...rest}>
      {name}
    </span>);
}

const Icon = {
  home: (p) => <MSym name="home" size={18} {...p} />,
  cookie: (p) => <MSym name="cookie" size={18} {...p} />,
  scan: (p) => <MSym name="qr_code_scanner" size={18} {...p} />,
  log: (p) => <MSym name="description" size={18} {...p} />,
  upgrade: (p) => <MSym name="upgrade" size={18} {...p} />,
  globe: (p) => <MSym name="language" size={16} {...p} />,
  bell: (p) => <MSym name="notifications" size={18} {...p} />,
  moon: (p) => <MSym name="dark_mode" size={18} {...p} />,
  chevron: (p) => <MSym name="expand_more" size={16} {...p} />,
  arrow: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>,
  arrowOut: (p) => <MSym name="arrow_outward" size={16} {...p} />,
  plus: (p) => <MSym name="add" size={16} {...p} />,
  warn: (p) => <MSym name="warning" size={18} {...p} />,
  category: (p) => <MSym name="grid_view" size={18} {...p} />,
  close: (p) => <MSym name="close" size={16} {...p} />,
  settings: (p) => <MSym name="settings" size={18} {...p} />,
  list: (p) => <MSym name="format_list_bulleted" size={18} {...p} />,
  layout: (p) => <MSym name="dashboard" size={18} {...p} />,
  paint: (p) => <MSym name="palette" size={18} {...p} />,
  type: (p) => <MSym name="text_fields" size={18} {...p} />,
  user: (p) => <MSym name="person" size={18} {...p} />,
  card: (p) => <MSym name="credit_card" size={18} {...p} />,
  pie: (p) => <MSym name="pie_chart" size={18} {...p} />,
  check: (p) => <MSym name="check" size={16} {...p} />,
  copy: (p) => <MSym name="content_copy" size={15} {...p} />,
  more: (p) => <MSym name="more_horiz" size={18} {...p} />,
  search: (p) => <MSym name="search" size={15} {...p} />,
  edit: (p) => <MSym name="edit" size={15} {...p} />,
  trash: (p) => <MSym name="delete" size={15} {...p} />,
  download: (p) => <MSym name="download" size={15} {...p} />,
  share: (p) => <MSym name="share" size={15} {...p} />,
};

// ----- Top bar -----

export { MSym, Icon };
