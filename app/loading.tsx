import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-[spin_1.2s_linear_infinite] rounded-full border border-transparent border-t-accent" />
        <Image
          src="/icon.png"
          alt=""
          width={40}
          height={40}
          priority
          aria-hidden
        />
      </div>
    </div>
  );
}
