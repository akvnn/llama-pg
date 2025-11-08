const LlamaLogo = ({ theme }: { theme: "light" | "dark" }) => {
  const fillColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
  const strokeColor = theme === "dark" ? "#ffffff" : "#000000";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className="h-full w-full"
    >
      <circle
        cx="32"
        cy="36"
        r="18"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <ellipse
        cx="24"
        cy="18"
        rx="3"
        ry="8"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
      />
      <ellipse
        cx="40"
        cy="18"
        rx="3"
        ry="8"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
      />
      <ellipse
        cx="32"
        cy="42"
        rx="8"
        ry="6"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
      />
      <ellipse cx="32" cy="44" rx="2.5" ry="2" fill={strokeColor} />
      <circle cx="26" cy="32" r="5" fill={strokeColor} />
      <circle cx="38" cy="32" r="5" fill={strokeColor} />
      <line
        x1="31"
        y1="32"
        x2="33"
        y2="32"
        stroke={strokeColor}
        strokeWidth="2"
      />
    </svg>
  );
};

export default LlamaLogo;
