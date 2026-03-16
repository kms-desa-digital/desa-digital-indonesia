import api from './api'

export const getCategories = async (): Promise<any> => await api.get('/innovations/categories')
