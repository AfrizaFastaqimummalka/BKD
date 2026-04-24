import { useState, useRef } from 'react'
import { Upload, FileText, X, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { dokumenApi, type Dokumen } from '../api/services'
import { ErrorMessage, Spinner } from './UI'

interface Props {
  aktivitasId: number
  existingDocs: Dokumen[]
  onClose: () => void
  onSaved: () => void
}

export default function UploadModal({ aktivitasId, existingDocs, onClose, onSaved }: Props) {
  const [docs, setDocs]         = useState<Dokumen[]>(existingDocs)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await Promise.all(
        files.map(f => dokumenApi.upload(aktivitasId, f))
      )
      setDocs(d => [...d, ...uploaded])
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (doc: Dokumen) => {
    setDeleting(doc.id)
    setError('')
    try {
      await dokumenApi.delete(doc.id)
      setDocs(d => d.filter(x => x.id !== doc.id))
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Modal title="Bukti Dokumen" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorMessage message={error} />}

        {/* Upload Zone */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
        >
          <div className="w-12 h-12 bg-slate-100 group-hover:bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
            {uploading ? <Spinner /> : <Upload size={20} className="text-slate-400 group-hover:text-brand-500 transition-colors" />}
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {uploading ? 'Mengupload...' : 'Klik untuk upload dokumen'}
          </div>
          <div className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX — maks 10MB</div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {/* Uploaded docs */}
        {docs.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-600">Dokumen terupload ({docs.length})</div>
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-brand-500" />
                </div>
                <a
                  href={doc.url_cloudinary}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-700 hover:text-brand-600 flex-1 truncate transition-colors"
                >
                  {doc.nama_file}
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deleting === doc.id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting === doc.id ? <Spinner className="w-4 h-4" /> : <Trash2 size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}

        {docs.length === 0 && !uploading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 justify-center py-2">
            <X size={12} /> Belum ada dokumen diupload
          </div>
        )}

        <button className="btn-secondary w-full" onClick={onClose}>
          Selesai
        </button>
      </div>
    </Modal>
  )
}
