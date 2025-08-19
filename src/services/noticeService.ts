import Notice, { INotice } from "@models/Notice";
import {
  CreateNoticeRequest,
  UpdateNoticeRequest,
  NoticeQueryParams,
  NoticeResponse,
  NoticeStats,
} from "../types/NoticeTypes";

export class NoticeService {
  /**
   * Crear un nuevo aviso
   */
  async createNotice(
    noticeData: CreateNoticeRequest,
    createdBy: string
  ): Promise<INotice> {
    const notice = new Notice({
      ...noticeData,
      createdBy,
    });

    const savedNotice = await notice.save();
    return (await Notice.findById(savedNotice._id)
      .populate("createdBy", "name email")
      .exec()) as INotice;
  }

  /**
   * Obtener todos los avisos (solo admin)
   */
  async getAllNotices(
    queryParams: NoticeQueryParams
  ): Promise<NoticeResponse[]> {
    const {
      type,
      isActive,
      includeExpired = true,
      limit = 50,
      page = 1,
    } = queryParams;

    const filter: any = {};

    // Filtros opcionales
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive;

    // Filtro para excluir expirados si se especifica
    if (!includeExpired) {
      const now = new Date();
      filter.$or = [{ endDate: null }, { endDate: { $gte: now } }];
    }

    const skip = (page - 1) * limit;

    const notices = await Notice.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return notices.map((notice) => ({
      ...notice,
      _id: (notice._id as any).toString(),
      createdBy: {
        _id: (notice.createdBy as any)._id.toString(),
        name: (notice.createdBy as any).name,
        email: (notice.createdBy as any).email,
      },
    })) as NoticeResponse[];
  }

  /**
   * Obtener avisos activos y vigentes
   */
  async getActiveNotices(): Promise<NoticeResponse[]> {
    const now = new Date();

    const notices = await Notice.find({
      isActive: true,
      $or: [
        // Sin fechas límite
        { startDate: null, endDate: null },
        // Solo con endDate válida
        { startDate: null, endDate: { $gte: now } },
        // Solo con startDate válida
        { startDate: { $lte: now }, endDate: null },
        // Con ambas fechas válidas
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return notices.map((notice) => ({
      ...notice,
      _id: (notice._id as any).toString(),
      createdBy: {
        _id: (notice.createdBy as any)._id.toString(),
        name: (notice.createdBy as any).name,
        email: (notice.createdBy as any).email,
      },
    })) as NoticeResponse[];
  }

  /**
   * Obtener aviso por ID
   */
  async getNoticeById(id: string): Promise<INotice | null> {
    return await Notice.findById(id).populate("createdBy", "name email").exec();
  }

  /**
   * Actualizar aviso
   */
  async updateNotice(
    id: string,
    updateData: UpdateNoticeRequest
  ): Promise<INotice | null> {
    // Obtener el aviso actual para validaciones
    const currentNotice = await Notice.findById(id);
    if (!currentNotice) {
      return null;
    }

    // Validar fechas si se proporcionan
    const newStartDate =
      updateData.startDate !== undefined
        ? updateData.startDate
          ? new Date(updateData.startDate)
          : null
        : currentNotice.startDate;

    const newEndDate =
      updateData.endDate !== undefined
        ? updateData.endDate
          ? new Date(updateData.endDate)
          : null
        : currentNotice.endDate;

    // Validar que las fechas sean consistentes
    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
    }

    // Realizar la actualización
    return await Notice.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: false } // Usamos validación manual
    ).populate("createdBy", "name email");
  }

  /**
   * Eliminar aviso permanentemente
   */
  async deleteNotice(id: string): Promise<boolean> {
    const result = await Notice.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Alternar estado activo/inactivo
   */
  async toggleNoticeStatus(id: string): Promise<INotice | null> {
    const notice = await Notice.findById(id);
    if (!notice) {
      return null;
    }

    notice.isActive = !notice.isActive;
    await notice.save();

    return await Notice.findById(id).populate("createdBy", "name email").exec();
  }

  /**
   * Obtener estadísticas de avisos
   */
  async getNoticeStats(): Promise<NoticeStats> {
    const now = new Date();

    // Total de avisos
    const total = await Notice.countDocuments();

    // Avisos activos
    const active = await Notice.countDocuments({ isActive: true });

    // Avisos por tipo
    const typeStats = await Notice.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const byType = {
      info: 0,
      warning: 0,
      urgent: 0,
      success: 0,
    };

    typeStats.forEach((stat) => {
      if (stat._id in byType) {
        byType[stat._id as keyof typeof byType] = stat.count;
      }
    });

    // Avisos expirados
    const expired = await Notice.countDocuments({
      isActive: true,
      endDate: { $lt: now },
    });

    // Avisos programados (con startDate futura)
    const scheduled = await Notice.countDocuments({
      isActive: true,
      startDate: { $gt: now },
    });

    return {
      total,
      active,
      byType,
      expired,
      scheduled,
    };
  }

  /**
   * Obtener avisos urgentes activos
   */
  async getUrgentNotices(): Promise<NoticeResponse[]> {
    const now = new Date();

    const notices = await Notice.find({
      isActive: true,
      type: "urgent",
      $or: [
        { startDate: null, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return notices.map((notice) => ({
      ...notice,
      _id: (notice._id as any).toString(),
      createdBy: {
        _id: (notice.createdBy as any)._id.toString(),
        name: (notice.createdBy as any).name,
        email: (notice.createdBy as any).email,
      },
    })) as NoticeResponse[];
  }

  /**
   * Limpiar avisos expirados automáticamente
   */
  async cleanupExpiredNotices(): Promise<number> {
    const now = new Date();
    const result = await Notice.deleteMany({
      isActive: false,
      endDate: { $lt: now },
      // Solo eliminar avisos inactivos que han estado expirados por más de 30 días
      updatedAt: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    });

    return result.deletedCount || 0;
  }
}
