import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FileUploader, type QueuedFile } from './FileUploader'

function Harness() {
  const [files, setFiles] = useState<QueuedFile[]>([])
  return <FileUploader files={files} onChange={setFiles} />
}

describe('FileUploader', () => {
  it('queues valid files and reports invalid ones', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)
    const input = screen.getByLabelText('Choose files to upload')
    await user.upload(input, [
      new File(['%PDF'], 'review.pdf', { type: 'application/pdf' }),
      new File(['MZ'], 'virus.exe', { type: 'application/x-msdownload' }),
    ])
    expect(screen.getByText('review.pdf')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('virus.exe: only PDF')
  })

  it('lets the user remove a queued file', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.upload(screen.getByLabelText('Choose files to upload'), new File(['x'], 'slides.pptx', { type: '' }))
    await user.click(screen.getByRole('button', { name: 'Remove slides.pptx' }))
    expect(screen.queryByText('slides.pptx')).not.toBeInTheDocument()
  })
})
