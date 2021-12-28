import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import type { FastifyReply, FastifyRequest } from 'fastify'
import treeKill from 'tree-kill'

import { directDownloadReferences } from '../../../downloads/media/direct-media-download'
import { spawnedDownloadProcessReferences } from '../../../downloads/media/spawn-external-download-process'
import { adminMediaDownloadsViewerOrganiser } from '../../../downloads/media/media-downloads-viewer-organiser'

async function cancelDownload(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const { downloadToCancel } = req.body as { downloadToCancel: string } & FastifyRequest

  // eslint-disable-next-line functional/no-conditional-statement
  if (directDownloadReferences.has(downloadToCancel)) {
    directDownloadReferences.get(downloadToCancel)?.stop()

    adminMediaDownloadsViewerOrganiser.setDownloadCancelled(
      downloadToCancel,
      'User cancelled download from admin downloads page.'
    )
  }

  // eslint-disable-next-line functional/no-conditional-statement
  if (spawnedDownloadProcessReferences.has(downloadToCancel)) {
    /*****
      Since we are using the shell for spawned processes, as per the docs here:
        https://nodejs.org/api/child_process.html#subprocesskillsignal "On Linux, child
        processes of child processes will not be terminated when attempting to kill their
        parent. This is likely to happen when running a new process in a shell or with the
        use of the shell option" - so we use the 3rd party 'tree-kill' to kill the spawned process
        and all of its children processes.
    *****/
    treeKill(spawnedDownloadProcessReferences.get(downloadToCancel) as number)

    adminMediaDownloadsViewerOrganiser.setDownloadCancelled(
      downloadToCancel,
      'User cancelled download from admin downloads page.'
    )
  }

  return reply.code(HttpStatusCode.OK).send()
}

export { cancelDownload }
