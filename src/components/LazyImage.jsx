export const LazyImage = ({ src, alt, ...rest }) => {
  return (
    <img
      src={src}
      alt={alt}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onMouseDown={(e) => {
        if (e.button === 2) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }}
      {...rest}
    />
  );
};
