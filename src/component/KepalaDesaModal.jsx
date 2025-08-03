'use client'

export default function EditKepalaDesaModal({ isOpen, onClose, formData, setFormData, onSubmit }) {
  if (!isOpen) return null

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, foto_kades: reader.result })) // base64 string
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/50 to-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl mx-4">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Edit Kepala Desa</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nama_kepala_desa">
              Nama
            </label>
            <input
              type="text"
              id="nama_kepala_desa"
              name="nama_kepala_desa"
              value={formData.nama_kepala_desa}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="jabatan_kepala_desa">
              Jabatan
            </label>
            <input
              type="text"
              id="jabatan_kepala_desa"
              name="jabatan_kepala_desa"
              value={formData.jabatan_kepala_desa}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" htmlFor="sambutan">
              Sambutan
            </label>
            <textarea
              id="sambutan"
              name="sambutan"
              value={formData.sambutan}
              onChange={handleChange}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 resize-y"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" htmlFor="foto_kades">
              Foto
            </label>
            <input
              type="file"
              id="foto_kades"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#129990]/20 file:text-[#129990] file:cursor-pointer"
            />
            {formData.foto_kades && (
              <img
                src={formData.foto_kades}
                alt="Preview"
                className="mt-4 w-40 h-40 object-cover rounded-full border"
              />
            )}
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#129990] text-white hover:bg-[#107c77] transition"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
