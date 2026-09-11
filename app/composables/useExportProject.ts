/** Downloads a project's export document and saves it as a file, without
 * navigating the page away (a plain `<a href>` to the API route would
 * trigger the browser's download for a same-origin JSON response, but
 * clicking it live-navigates until the download starts). */
export function useExportProject() {
  async function exportProject(id: number, identifier: string) {
    const blob = await $fetch<Blob>(`/api/projects/${id}/export`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = `${identifier}.json`
      link.click()
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  return { exportProject }
}
