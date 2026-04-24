import axios from 'axios';
import {type CustomerPayload,type SurveyAnalysisResult } from '../types/types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const apiClient = {
  createCase: async (payload: CustomerPayload) => {
    const response = await api.post('/create-case', {
      customer_payload: payload,
    });
    return response.data; 
  },

  analyzeImage: async (caseId: string, category: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('category', category);
    formData.append('image', imageFile);

    const response = await api.post('/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // כאן זה מחזיר עכשיו או {status: 'success'} או {status: 'retry_required'}
    return response.data; 
  },

  finalizeCase: async (caseId: string) => {
    const formData = new FormData();
    formData.append('case_id', caseId);

    const response = await api.post('/finalize-case', formData);
    return response.data;
  },
};