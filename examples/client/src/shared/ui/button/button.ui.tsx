import cn from 'classnames'
import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: 'primary' | 'secondary'
  variant?: 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Button(props: ButtonProps) {
  const { color = 'primary', size = 'sm', variant, className, ...other } = props

  const classes = cn(
    {
      btn: true,
      [`btn-${color}`]: !variant,
      [`btn-${variant}-${color}`]: variant,
      [`btn-${size}`]: size,
    },
    className,
  )

  return <button className={classes} type="button" {...other} />
}
