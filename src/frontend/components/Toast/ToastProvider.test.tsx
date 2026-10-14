import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './toastContext.ts'
import { ToastProvider } from './ToastProvider.tsx'

function Trigger() {
  const toast = useToast()
  return (
    <>
      <button type="button" onClick={() => toast.success('Saved')}>ok</button>
      <button type="button" onClick={() => toast.error('Failed')}>fail</button>
    </>
  )
}

afterEach(() => { vi.useRealTimers() })

describe('ToastProvider', () => {
  it('announces toasts in a live region and dismisses them', () => {
    render(<ToastProvider><Trigger /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'ok' }))

    const region = screen.getByRole('status', { name: 'Notifications' })
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveTextContent('Saved')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(region).not.toHaveTextContent('Saved')
  })

  it('auto-dismisses success sooner than errors', () => {
    vi.useFakeTimers()
    render(<ToastProvider><Trigger /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'ok' }))
    fireEvent.click(screen.getByRole('button', { name: 'fail' }))

    act(() => { vi.advanceTimersByTime(4000) })
    const region = screen.getByRole('status', { name: 'Notifications' })
    expect(region).not.toHaveTextContent('Saved')
    expect(region).toHaveTextContent('Failed')

    act(() => { vi.advanceTimersByTime(4000) })
    expect(region).not.toHaveTextContent('Failed')
  })

  it('is a silent no-op without a provider', () => {
    render(<Trigger />)
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'ok' }))).not.toThrow()
  })
})
