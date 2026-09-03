'use client'

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { validateImageFile } from '@/lib/image/validation'
import { compressForUpload } from '@/lib/image/compress'
import { analyzeImageInBrowser, preloadBrowserModel } from '@/lib/inference/browser/detect'
import { AnalysisPreview } from '@/components/inference/AnalysisPreview'
import { hasDetection } from '@/types/domain'
import type { DetectorOutput } from '@/types/domain'

export default function NewComplaintPage() {
  const [reporterName, setReporterName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<DetectorOutput | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileRef = useRef<File | null>(null)
  const [requestId] = useState(() => crypto.randomUUID())
  const router = useRouter()

  // Warm the browser ONNX session while the user is still typing, so
  // there's no cold-start delay once they pick a photo (CLAUDE.md §33).
  useEffect(() => {
    preloadBrowserModel()
  }, [])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    fileRef.current = file
    setPreviewUrl(URL.createObjectURL(file))
    setAnalysis(null)
    setAnalyzing(true)

    try {
      const result = await analyzeImageInBrowser(file)
      setAnalysis(result)
    } catch {
      setError('Could not analyze the photo. Please try a different one.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!fileRef.current) {
      setError('Please choose a photo.')
      return
    }
    if (!analysis || !hasDetection(analysis)) {
      setError('Unable to confidently identify a supported visible defect. Please choose a clearer photograph.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { main, thumbnail } = await compressForUpload(fileRef.current)

      const formData = new FormData()
      formData.append('reporterName', reporterName)
      formData.append('location', location)
      formData.append('description', description)
      formData.append('image', main.blob, 'image.webp')
      formData.append('thumbnail', thumbnail.blob, 'thumbnail.webp')
      formData.append('clientRequestId', requestId)

      const res = await fetch('/api/complaints', { method: 'POST', body: formData })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error || 'Failed to submit the complaint.')
        setSubmitting(false)
        return
      }

      router.push(`/user/complaints/${body.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const canSubmit = !submitting && !analyzing && analysis !== null && hasDetection(analysis)

  return (
    <div className="max-w-2xl mx-auto pb-12 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-primary">Report a Maintenance Defect</h1>
        <p className="mt-1 text-sm text-ink-secondary">Photo-Based Facility Maintenance Triage</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Upload */}
        <section className="card p-6">
          <h2 className="text-lg font-medium text-ink-primary mb-4">Step 1: Upload photo</h2>
          <div>
            <label htmlFor="photo-upload" className="block text-sm font-medium text-ink-primary mb-2">Photograph <span className="text-red-500">*</span></label>
            <div className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${
              previewUrl ? 'border-brand-500 bg-brand-50/50' : 'border-border hover:border-brand-500 hover:bg-brand-50/30 bg-surface'
            }`}>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleFileChange}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-500/20 rounded-lg"
              />
              
              {!previewUrl && (
                <div className="text-center pointer-events-none">
                  <svg className="mx-auto h-12 w-12 text-ink-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium text-brand-700">Tap to take a photo or select a file</p>
                  <p className="text-xs text-ink-muted mt-1">JPEG, PNG, WEBP</p>
                </div>
              )}

              {previewUrl && (
                <div className="w-full flex flex-col items-center pointer-events-none">
                  <img
                    src={previewUrl}
                    alt="Selected defect photo"
                    className="max-h-64 rounded-md object-contain shadow-sm mb-3"
                  />
                  <p className="text-sm font-medium text-brand-700">Tap to change photo</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Analysis Preview */}
        {(analyzing || analysis) && (
          <section className="card p-6" aria-live="polite">
            <h2 className="text-lg font-medium text-ink-primary mb-2">Step 2: Analysis preview</h2>
            
            {analyzing && (
              <div className="flex items-center gap-3 p-4 bg-surface-muted rounded-lg border border-border">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-700"></div>
                <p className="text-sm font-medium text-ink-secondary">Analyzing photo…</p>
              </div>
            )}

            {analysis && hasDetection(analysis) && (
              <div className="space-y-3">
                <p className="text-sm text-ink-secondary bg-surface-muted p-3 rounded-lg border border-border mb-4">
                  This is a preliminary analysis. Final classification and priority are confirmed when the complaint is submitted.
                </p>
                <AnalysisPreview result={analysis} />
              </div>
            )}

            {analysis && !hasDetection(analysis) && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3" role="alert">
                <svg className="h-5 w-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700 font-medium">
                  Unable to confidently identify a supported visible defect. Please choose a clearer photograph.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Step 3: Details */}
        <section className={`card p-6 transition-opacity duration-300 ${!analysis || !hasDetection(analysis) ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <h2 className="text-lg font-medium text-ink-primary mb-4">Step 3: Enter complaint details</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="reporterName" className="block text-sm font-medium text-ink-primary mb-1">Reporter name <span className="text-red-500">*</span></label>
                <input
                  id="reporterName"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  required
                  disabled={!analysis || !hasDetection(analysis)}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-ink-primary mb-1">Location / address <span className="text-red-500">*</span></label>
                <input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={!analysis || !hasDetection(analysis)}
                  placeholder="e.g. Hostel B, Floor 2"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ink-primary mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={!analysis || !hasDetection(analysis)}
                rows={3}
                className="input-field resize-y"
              />
            </div>
          </div>
        </section>

        {/* Step 4: Submit */}
        <section className="pt-2">
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3" role="alert">
              <svg className="h-5 w-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={!canSubmit} 
            className="btn-primary w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting…
              </>
            ) : 'Submit Complaint'}
          </button>
        </section>
      </form>
    </div>
  )
}
