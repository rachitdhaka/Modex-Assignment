export const Container = ({
  children,
  ClassName,
}: {
  children: React.ReactNode;
  ClassName?: String;
}) => {
  return <div className={`max-w-7xl  mx-auto ${ClassName || ""}`}>{children}</div>;
};

export default Container;
