import { get, post } from '../utils/axiosConfig.js';

const handleRequest = async (method, url, data = null, headers = {}) => {
  try {
    const response = await method(url, data, { headers });
    console.log(`Request to ${url} successful:`, response);
    return response;
  } catch (error) {
    console.error(`Error in request to ${url}:`, error);
    throw error;
  }
};

export const getJobs = () => handleRequest(get, '/jobs');

export const getJobById = (id) => handleRequest(get, `/job/${id}`);

export const deleteJob = (id) => handleRequest(post, `/delete-job/${id}`);

export const updateJob = (id, data) => handleRequest(post, `/edit-job/${id}`, data);

export const toggleJob = (id) => handleRequest(post, `/toggle-job/${id}`);

export const uploadFile = (data) => handleRequest(post, '/upload-file', data);

export const getJobDelete = () => handleRequest(get, `/jobs/deleted`);
export const restoreJob = (id) => handleRequest(post, `/jobs/${id}/restore`);
export const deleteJobForever = (id) => handleRequest(post, `/jobs/${id}/forever`);
