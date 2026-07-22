import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type {
  CreateSavedPassengerInput,
  UpdateSavedPassengerInput,
} from "@moja/schemas";
import type {
  EnsurePassengerProfileResult,
  SavedPassengerDTO,
  SavedPassengersListResult,
} from "@moja/types";

const MAX_SAVED_PASSENGERS = 20;

type SavedPassengerRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  label: string | null;
  dateOfBirth: Date | null;
  idType: string | null;
  idNumber: string | null;
  isSelf: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class SavedPassengerService {
  constructor(private prisma: PrismaClient) {}

  private toDto(row: SavedPassengerRow): SavedPassengerDTO {
    return {
      id: row.id,
      fullName: row.fullName,
      phone: row.phone,
      email: row.email,
      label: row.label,
      dateOfBirth: row.dateOfBirth,
      idType: row.idType,
      idNumber: row.idNumber,
      isSelf: row.isSelf,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async ensureProfile(userId: string): Promise<EnsurePassengerProfileResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, phoneNumber: true },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    let profile = await this.prisma.passengerProfile.findUnique({
      where: { userId },
      include: { savedPassengers: { where: { isSelf: true } } },
    });

    if (!profile) {
      profile = await this.prisma.passengerProfile.create({
        data: { userId },
        include: { savedPassengers: { where: { isSelf: true } } },
      });
    }

    let selfPassenger = profile.savedPassengers[0] ?? null;

    if (!selfPassenger && user.fullName && user.phoneNumber) {
      selfPassenger = await this.prisma.savedPassenger.create({
        data: {
          profileId: profile.id,
          fullName: user.fullName,
          phone: user.phoneNumber,
          isSelf: true,
          label: "Me",
        },
      });
    }

    return {
      profileId: profile.id,
      selfPassenger: selfPassenger ? this.toDto(selfPassenger) : null,
    };
  }

  private async getProfileForUser(userId: string) {
    const { profileId } = await this.ensureProfile(userId);
    return profileId;
  }

  async listSaved(userId: string): Promise<SavedPassengersListResult> {
    const profileId = await this.getProfileForUser(userId);

    const items = await this.prisma.savedPassenger.findMany({
      where: { profileId },
      orderBy: [{ isSelf: "desc" }, { fullName: "asc" }],
    });

    return {
      items: items.map((row) => this.toDto(row)),
      total: items.length,
    };
  }

  async createSaved(
    userId: string,
    input: CreateSavedPassengerInput,
  ): Promise<SavedPassengerDTO> {
    const profileId = await this.getProfileForUser(userId);

    const count = await this.prisma.savedPassenger.count({
      where: { profileId },
    });

    if (count >= MAX_SAVED_PASSENGERS) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `You can save up to ${MAX_SAVED_PASSENGERS} passengers`,
      });
    }

    const created = await this.prisma.savedPassenger.create({
      data: {
        profileId,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        label: input.label?.trim() || null,
        dateOfBirth: input.dateOfBirth ?? null,
        idType: input.idType ?? null,
        idNumber: input.idNumber?.trim() || null,
        isSelf: false,
      },
    });

    return this.toDto(created);
  }

  async updateSaved(
    userId: string,
    input: UpdateSavedPassengerInput,
  ): Promise<SavedPassengerDTO> {
    const profileId = await this.getProfileForUser(userId);

    const existing = await this.prisma.savedPassenger.findFirst({
      where: { id: input.id, profileId },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Saved passenger not found",
      });
    }

    const updated = await this.prisma.savedPassenger.update({
      where: { id: input.id },
      data: {
        ...(input.fullName !== undefined
          ? { fullName: input.fullName.trim() }
          : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.email !== undefined
          ? { email: input.email?.trim() || null }
          : {}),
        ...(input.label !== undefined
          ? { label: input.label?.trim() || null }
          : {}),
        ...(input.dateOfBirth !== undefined
          ? { dateOfBirth: input.dateOfBirth ?? null }
          : {}),
        ...(input.idType !== undefined ? { idType: input.idType ?? null } : {}),
        ...(input.idNumber !== undefined
          ? { idNumber: input.idNumber?.trim() || null }
          : {}),
      },
    });

    return this.toDto(updated);
  }

  async deleteSaved(userId: string, id: string): Promise<{ success: true }> {
    const profileId = await this.getProfileForUser(userId);

    const existing = await this.prisma.savedPassenger.findFirst({
      where: { id, profileId },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Saved passenger not found",
      });
    }

    if (existing.isSelf) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot delete your own passenger profile",
      });
    }

    const bookingCount = await this.prisma.booking.count({
      where: { savedPassengerId: id },
    });

    if (bookingCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "This passenger has past bookings and cannot be deleted. Edit their details instead.",
      });
    }

    await this.prisma.savedPassenger.delete({ where: { id } });
    return { success: true };
  }

  /** Resolve name/phone for a seat assignment; verifies ownership when savedPassengerId is used. */
  async resolveSeatPassenger(
    userId: string | null | undefined,
    input: {
      savedPassengerId?: string | undefined;
      passenger?: { passengerName: string; passengerPhone: string } | undefined;
    },
  ): Promise<{
    passengerName: string;
    passengerPhone: string;
    savedPassengerId: string | null;
  }> {
    if (input.savedPassengerId) {
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sign in to use saved passengers",
        });
      }

      const profileId = await this.getProfileForUser(userId);
      const saved = await this.prisma.savedPassenger.findFirst({
        where: { id: input.savedPassengerId, profileId },
      });

      if (!saved) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Saved passenger not found",
        });
      }

      return {
        passengerName: saved.fullName,
        passengerPhone: saved.phone,
        savedPassengerId: saved.id,
      };
    }

    if (!input.passenger) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Passenger details are required",
      });
    }

    return {
      passengerName: input.passenger.passengerName.trim(),
      passengerPhone: input.passenger.passengerPhone.trim(),
      savedPassengerId: null,
    };
  }
}
