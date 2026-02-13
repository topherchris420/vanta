'use client'

export function SplineScene({ scene, className }) {
  return (
    <div className={className}>
      <iframe
        title="Spline Scene"
        src={`https://my.spline.design/viewer?url=${encodeURIComponent(scene)}`}
        className="w-full h-full border-0"
        loading="lazy"
        allow="fullscreen"
      />
    </div>
  )
}
