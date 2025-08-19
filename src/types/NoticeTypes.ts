export interface CreateNoticeRequest {
  title: string;
  message: string;
  type?: "info" | "warning" | "urgent" | "success";
  isActive?: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface UpdateNoticeRequest {
  title?: string;
  message?: string;
  type?: "info" | "warning" | "urgent" | "success";
  isActive?: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

export interface NoticeResponse {
  _id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent" | "success";
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeQueryParams {
  type?: "info" | "warning" | "urgent" | "success";
  isActive?: boolean;
  includeExpired?: boolean;
  limit?: number;
  page?: number;
}

export interface ActiveNoticesFilter {
  isActive: boolean;
  $or?: Array<{
    startDate?: any;
    endDate?: any;
  }>;
}

export interface NoticeStats {
  total: number;
  active: number;
  byType: {
    info: number;
    warning: number;
    urgent: number;
    success: number;
  };
  expired: number;
  scheduled: number; // Avisos con startDate futura
}
