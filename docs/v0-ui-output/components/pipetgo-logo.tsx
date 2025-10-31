import Image from "next/image"

export function PipetGoLogo({ className = "", showTagline = false }: { className?: string; showTagline?: boolean }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/pipetgo-logo.png"
        alt="PipetGo - Connect. Test. Deliver."
        width={showTagline ? 280 : 200}
        height={showTagline ? 80 : 40}
        className="object-contain"
        priority
      />
    </div>
  )
}
