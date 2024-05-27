import { generateOcsUrl } from "@nextcloud/router";
import axios from '@nextcloud/axios'

import type { AxiosResponse } from 'axios'

export enum NcShareType {
    SHARE_TYPE_USER = 0,
    SHARE_TYPE_GROUP = 1,
    SHARE_TYPE_LINK = 3,
    SHARE_TYPE_EMAIL = 4,
    SHARE_TYPE_REMOTE = 6,
    SHARE_TYPE_CIRCLE = 7,
    SHARE_TYPE_GUEST = 8,
    SHARE_TYPE_REMOTE_GROUP = 9,
    SHARE_TYPE_ROOM = 10,
    SHARE_TYPE_DECK = 12,
}

/**
 * Successful OCS responses look like this, `T` is a template for the response data inside the response
 */
export interface NcOCSResponse<T>{
    ocs: {
        data: T,
        meta: {
            message: string,
            status: string,
            statuscode: number,
        }
    }
}

/**
 * interface, generated using QuickType from response object
 * TODO: find out where this is defined and make better
 */
export interface ShareData {
    id:                     string;
    share_type:             number;
    uid_owner:              string;
    displayname_owner:      string;
    permissions:            number;
    can_edit:               boolean;
    can_delete:             boolean;
    stime:                  number;
    parent:                 null;
    expiration:             null;
    token:                  string;
    uid_file_owner:         string;
    note:                   string;
    label:                  string;
    displayname_file_owner: string;
    path:                   string;
    item_type:              string;
    mimetype:               string;
    has_preview:            boolean;
    storage_id:             string;
    storage:                number;
    item_source:            number;
    file_source:            number;
    file_parent:            number;
    file_target:            string;
    share_with:             string | null;
    share_with_displayname: string;
    password:               any;
    send_password_by_talk:  boolean;
    url:                    string;
    mail_send:              number;
    hide_download:          number;
    attributes:             any;
}

/**
 * OCS sharing url of the current nextcloud instance
 */
export const ncOcsSharingUrl = generateOcsUrl('/apps/files_sharing/api/v1/shares')

/**
 * default headers for responses. Add your own to this object if you want to modify them
 */
export const ncShareHeaders = {
    'OCS-APIRequest': true,
    Accept: 'application/json',
}

/**
 * Get all shares of the currently logged in user
 * 
 * @returns A Promise holding a `ShareData[]` at `.data.ocs.data` if successful.
 */
export const getAllUserShares = async (): Promise<AxiosResponse<NcOCSResponse<ShareData[]>>> => axios.get<NcOCSResponse<ShareData[]>>(
    ncOcsSharingUrl, 
    {
        headers: ncShareHeaders,
    },
)

/**
 * Get all shares of a File or Folder at `path`
 *
 * @param path Path to the File/Folder to query
 * @param reshares Returns not only the shares from the current user but all shares from the given file.
 * @param subfiles Returns all shares within a folder, given that path defines a folder
 * @returns A Promise holding a `ShareData[]` at `.data.ocs.data` if successful.
 */
export const getFileFolderShares = async (
    path: string,
    reshares?: boolean,
    subfiles?: boolean,
): Promise<AxiosResponse<NcOCSResponse<ShareData[]>>>  => axios.get<NcOCSResponse<ShareData[]>>(
    ncOcsSharingUrl,
    {
        params: {
            path,
            reshares,
            subfiles,
        },
        headers: ncShareHeaders,
    }
)

/**
 * Get information of a share by share ID
 * 
 * @param shareId ID of the share
 * @returns A Promise holding a `ShareData` at `.data.ocs.data` if successful.
 */
export const getShareInformation = async (shareId: string | number): Promise<AxiosResponse<NcOCSResponse<ShareData>>> => axios.get<NcOCSResponse<ShareData>>(
    `${ncOcsSharingUrl}/${shareId}`,
    {
        headers: ncShareHeaders,
    }
)

/**
 * Create a new public link share
 * 
 * @param path Path to the file/folder which should be shared
 * @param publicUpload allow public upload to a public shared folder
 * @param password password to protect public link Share with
 * @param permissions permission bits
 * @param expireDate Set an expire date. This argument expects a well formatted date string, e.g. ‘YYYY-MM-DD’
 * @param attributes URI-encoded serialized JSON string for [share attributes](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html#share-attributes)
 * @returns A Promise holding a `ShareData` at `.data.ocs.data` if successful.
 */
export const createNewLinkShare = async (
    /**
     * path to the file/folder which should be shared
     */
    path: string,
    /**
     * allow public upload to a public shared folder
     * @default false
     */
    publicUpload?: boolean,
    /**
     * password to protect public link Share with
     * 
     * @default undefined
     */
    password?: string,
    /**
     * permission bits
     * - 1 = read
     * - 2 = update
     * - 4 = create
     * - 8 = delete
     * - 16 = share
     * - 31 = 1 + 2 + 4 + 8 + 16 = all
     * @default 1
     */
    permissions?: number,
    /**
     * set a expire date for public link shares. This argument expects a well formatted date string, e.g. ‘YYYY-MM-DD’
     */
    expireDate?: string,
    /**
     * Share attributes are used for more advanced flags like permissions.
     * 
     * URI-encoded serialized JSON string for [share attributes](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html#share-attributes)
     * 
     * To remove the download permission from a share, use the following serialized string in the “attributes” parameter:
     * ```
     * '[{"scope":"permissions","key":"download","enabled":false}]'
     * ```
     */
    attributes?: string
): Promise<AxiosResponse<NcOCSResponse<ShareData>>> => axios.post<NcOCSResponse<ShareData>>(
    ncOcsSharingUrl,
    {
        path,
        shareType: NcShareType.SHARE_TYPE_LINK,
        publicUpload,
        password,
        permissions,
        expireDate,
        attributes,
    },
    {
        headers: ncShareHeaders,
    }
)

/**
 * Create a new non-link share
 * 
 * @param path Path to the file/folder which should be shared
 * @param publicUpload allow public upload to a public shared folder
 * @param password password to protect public link Share with
 * @param permissions permission bits
 * @param expireDate Set an expire date. This argument expects a well formatted date string, e.g. ‘YYYY-MM-DD’
 * @param attributes URI-encoded serialized JSON string for [share attributes](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html#share-attributes)
 * @returns A Promise holding a `ShareData` at `.data.ocs.data` if successful.
 */
export const createNewShare = async (
    /**
     * path to the file/folder which should be shared
     */
    path: string,
    /**
     * shareType
     * - 0 = user
     * - 1 = group
     * - 3 = public link - use createNewLinkShare
     * - 4 = email
     * - 6 = federated cloud share
     * - 7 = circle
     * - 10 = Talk conversation
     */
    shareType: Omit<NcShareType, 'SHARE_TYPE_LINK'>,
    /**
     * permission bits
     * - 1 = read
     * - 2 = update
     * - 4 = create
     * - 8 = delete
     * - 16 = share
     * - 31 = 1 + 2 + 4 + 8 + 16 = all
     * @default 31
     */
    permissions?: number,
    /**
     * Adds a note for the share recipient(s)
     */
    note?: string,
    /**
     * Share attributes are used for more advanced flags like permissions.
     * 
     * URI-encoded serialized JSON string for [share attributes](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html#share-attributes)
     * 
     * To remove the download permission from a share, use the following serialized string in the “attributes” parameter:
     * ```
     * '[{"scope":"permissions","key":"download","enabled":false}]'
     * ```
     */
    attributes?: string
): Promise<AxiosResponse<NcOCSResponse<ShareData>>> => axios.post<NcOCSResponse<ShareData>>(
    ncOcsSharingUrl,
    {
        path,
        shareType,
        permissions,
        note,
        attributes,
    },
    {
        headers: ncShareHeaders,
    }
)

/**
 * Remove the given share.
 * 
 * @param shareId share ID
 * @returns a Promise of the AxiosResponse
 */
export const deleteShare = async ( shareId: number ) => axios.delete(
    `${ncOcsSharingUrl}/${shareId}`,
    {
        headers: ncShareHeaders,
    }
)

/**
 * Update a specific parameter of a share
 * 
 * @param shareId share Id
 * @param parameter The parameter to update, see createNew(Link)Share for what these mean
 * @returns a Promise of the AxiosResponse
 */
export const updateShare = async ( shareId: number, parameter: 
    | { permissions: number }
    | { password: string }
    | { publicUpload: string }
    | { expireDate: string }
    | { note: string }
    | { attributes: string }
) => axios.put(
    `${ncOcsSharingUrl}/${shareId}`,
    parameter,
    {
        headers: ncShareHeaders,
    }
)