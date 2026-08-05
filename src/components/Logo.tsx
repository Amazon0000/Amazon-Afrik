export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  void withText;
  return (
    <div className="flex items-center select-none shrink-0">
      <img
        src="/zando.png"
        alt="Zando"
        style={{ height: size }}
        className="object-contain w-auto block shrink-0"
      />
    </div>
  );
}
