import { forwardRef, useState } from 'react'

function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
    </svg>
  )
}

const PasswordInput = forwardRef(function PasswordInput({
  className = '',
  wrapClassName = '',
  ...props
}, ref) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`password-input-wrap${wrapClassName ? ` ${wrapClassName}` : ''}`}>
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={className}
        {...props}
      />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  )
})

export default PasswordInput
