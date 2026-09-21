const OWNER = 'Dusunax'

/** 저작권 표기. 연도는 현재 연도를 따른다. */
export function Copyright({ className }: { className?: string }) {
  return (
    <p className={`copyright${className ? ` ${className}` : ''}`}>
      © {new Date().getFullYear()} {OWNER}. All Rights Reserved.
    </p>
  )
}
