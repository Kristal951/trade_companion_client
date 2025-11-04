import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6', ...props }) => {
  const icons: { [key: string]: React.ReactElement } = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
    signals: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.125 1.125 0 010 2.25H5.625a1.125 1.125 0 010-2.25z" />,
    mentors: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-1.063M15 19.128c-.618 0-1.125-.506-1.125-1.125v-2.625c0-.621.507-1.125 1.125-1.125h2.25c.618 0 1.125.504 1.125 1.125v2.625c0 .621-.507 1.125-1.125 1.125H15zM4.5 4.5v15A2.25 2.25 0 006.75 21.75h3.75a2.25 2.25 0 002.25-2.25V4.5m-6 0h6m-6 0a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 4.5m-6 0v-2.25c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V4.5" />,
    analytics: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-2.25m3.75 2.25l-2.25 3.75" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.008 1.11-1.226M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5zm-3.006-4.902a2.25 2.25 0 10-4.24-2.242 2.25 2.25 0 004.24 2.242z" />,
    billing: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m-6 2.25h6M3 12l6 6l9-12" />,
    apply: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />,
    chat: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.455.09-.91.09-1.365 0-3.076 2.57-5.591 5.73-5.591s5.73 2.515 5.73 5.591c0 .229-.015.456-.043.68c.284.42.63.799 1.02.1133a5.97 5.97 0 01.42-3.215C20.477 14.805 21 13.448 21 12zM3.75 12a8.25 8.25 0 1016.5 0 8.25 8.25 0 00-16.5 0z" />,
    calculator: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zM4.5 21.75h15A2.25 2.25 0 0021.75 19.5V4.5A2.25 2.25 0 0019.5 2.25h-15A2.25 2.25 0 002.25 4.5v15A2.25 2.25 0 004.5 21.75z" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.31h5.455a.563.563 0 01.31.959l-4.418 3.203a.563.563 0 00-.184.62l1.681 4.773a.563.563 0 01-.812.622l-4.418-3.203a.563.563 0 00-.62 0l-4.418 3.203a.563.563 0 01-.812-.622l1.681-4.773a.563.563 0 00-.184-.62L2.053 9.88a.563.563 0 01.31-.959h5.455a.563.563 0 00.475-.31l2.125-5.11z" />,
    arrowRight: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />,
    education: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    paperclip: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-6.364-6.364l7.927-7.928a3.375 3.375 0 014.773 4.773l-7.22 7.22a.75.75 0 01-1.06 0l-1.06-1.061a.75.75 0 010-1.06l7.22-7.221" />
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
      {icons[name] || <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />}
    </svg>
  );
};

export default Icon;