import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { StudentGroupService } from '../student-group/student-group.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
    private readonly studentGroupService: StudentGroupService,
  ) {}

  private normalizeRole(role?: string | null) {
    return (role || '').toLowerCase();
  }

  private async getUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });
  }

  private async getParticipantMessages(participantIds: number[]) {
    return this.prisma.message.findMany({
      where: {
        sender_id: { in: participantIds },
        receiver_id: { in: participantIds },
      },
      include: {
        sender: { include: { role: true } },
        receiver: { include: { role: true } },
      },
      orderBy: { sent_at: 'asc' },
    });
  }

  private buildThread({
    currentUserId,
    anchorUser,
    studentUser,
    supervisorUser,
    messages,
    assignmentId,
  }: {
    currentUserId: number;
    anchorUser: any;
    studentUser: any;
    supervisorUser: any;
    messages: any[];
    assignmentId: string;
  }) {
    const lastMsg = messages[messages.length - 1] ?? null;
    const unreadCount = messages.filter(
      (message) => message.receiver_id === currentUserId && message.read_status === 'unread',
    ).length;

    return {
      assignment_id: assignmentId,
      other_user_id: String(anchorUser.user_id),
      other_user_name: anchorUser.full_name,
      other_user_role: anchorUser.role?.role_name ?? '',
      student_id: String(studentUser.user_id),
      student_name: studentUser.full_name,
      supervisor_id: String(supervisorUser.user_id),
      supervisor_name: supervisorUser.full_name,
      messages: messages.map((message) => this.mapMessage(message, currentUserId)),
      unread_count: unreadCount,
      last_message_at: lastMsg?.sent_at?.toISOString?.() ?? null,
    };
  }

  private async getStudentGroupThread(currentUserId: number, supervisorUserId: number) {
    const [currentUser, supervisorUser, groupSummary] = await Promise.all([
      this.getUser(currentUserId),
      this.getUser(supervisorUserId),
      this.studentGroupService.getMyGroup(currentUserId),
    ]);

    if (!currentUser || !supervisorUser || !groupSummary) {
      throw new NotFoundException('Conversation not found');
    }

    const participantIds = [
      supervisorUser.user_id,
      ...groupSummary.members
        .map((member: any) => Number(member.student_user_id))
        .filter((id: number) => Number.isInteger(id)),
    ];

    const messages = await this.getParticipantMessages(participantIds);

    const thread = this.buildThread({
      currentUserId,
      anchorUser: supervisorUser,
      studentUser: currentUser,
      supervisorUser,
      messages,
      assignmentId: `group-${groupSummary.group_id}`,
    });

    return { ...thread, team_name: (groupSummary.team_name ?? null) };
  }

  private async getSupervisorGroupThread(currentUserId: number, studentUserId: number) {
    const [currentUser, anchorStudent, groups] = await Promise.all([
      this.getUser(currentUserId),
      this.getUser(studentUserId),
      this.studentGroupService.getSupervisorGroups(currentUserId),
    ]);

    if (!currentUser || !anchorStudent) {
      throw new NotFoundException('Conversation not found');
    }

    const matchedGroup = groups.find((group) =>
      group.members.some((member: any) => member.student_user_id === String(studentUserId)),
    );

    if (!matchedGroup) {
      throw new BadRequestException('This student is not part of your group');
    }

    const participantIds = [
      currentUserId,
      ...matchedGroup.members
        .map((member: any) => Number(member.student_user_id))
        .filter((id: number) => Number.isInteger(id)),
    ];

    const messages = await this.getParticipantMessages(participantIds);

    const thread = this.buildThread({
      currentUserId,
      anchorUser: anchorStudent,
      studentUser: anchorStudent,
      supervisorUser: currentUser,
      messages,
      assignmentId: `group-${matchedGroup.group_id}`,
    });

    return { ...thread, team_name: (matchedGroup.team_name ?? null) };
  }

  private async getAdminSupervisorThread(currentUserId: number, adminUserId: number) {
    const [currentUser, adminUser] = await Promise.all([
      this.getUser(currentUserId),
      this.getUser(adminUserId),
    ]);

    if (!currentUser || !adminUser) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { sender_id: currentUserId, receiver_id: adminUserId },
          { sender_id: adminUserId, receiver_id: currentUserId },
        ],
      },
      include: {
        sender: { include: { role: true } },
        receiver: { include: { role: true } },
      },
      orderBy: { sent_at: 'asc' },
    });

    return this.buildThread({
      currentUserId,
      anchorUser: adminUser,
      studentUser: currentUser,
      supervisorUser: currentUser,
      messages,
      assignmentId: `admin-${currentUserId}`,
    });
  }

  async getAvailableContactsForUser(userId: number, pair: string = 'merged') {
    const currentUser = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    const currentRole = currentUser.role?.role_name;
    const normalizedPair = pair.toLowerCase();
    let targetRoles: string[] = [];

    if (normalizedPair === 'merged') {
      if (currentRole === 'Admin') {
        targetRoles = ['University Coordinator', 'Supervisor'];
      } else if (currentRole === 'University Coordinator') {
        targetRoles = ['Admin'];
      } else if (currentRole === 'Supervisor') {
        targetRoles = ['Admin'];
      } else if (currentRole === 'Student') {
        targetRoles = ['Supervisor'];
      } else {
        return [];
      }
    } else if (normalizedPair === 'admin-university') {
      if (currentRole === 'Admin') {
        targetRoles = ['University Coordinator'];
      } else if (currentRole === 'University Coordinator') {
        targetRoles = ['Admin'];
      } else {
        return [];
      }
    } else if (normalizedPair === 'admin-supervisor') {
      if (currentRole === 'Admin') {
        targetRoles = ['Supervisor'];
      } else if (currentRole === 'Supervisor') {
        targetRoles = ['Admin'];
      } else {
        return [];
      }
    } else {
      return [];
    }

    const contacts = await this.prisma.user.findMany({
      where: {
        role: { role_name: { in: targetRoles } },
        account_status: { not: 'locked' },
      },
      include: { role: true },
      orderBy: { full_name: 'asc' },
    });

    return contacts
      .filter((contact) => contact.user_id !== userId)
      .map((contact) => ({
        user_id: String(contact.user_id),
        full_name: contact.full_name,
        email: contact.email,
        role: contact.role?.role_name || '',
      }));
  }

  // ─── private helpers ─────────────────────────────────────────────────────

  private mapMessage(msg: any, currentUserId: number) {
    return {
      message_id: String(msg.message_id),
      sender_id: String(msg.sender_id),
      sender_name: msg.sender?.full_name ?? '',
      sender_role: msg.sender?.role?.role_name?.toLowerCase() ?? '',
      recipient_id: String(msg.receiver_id),
      recipient_name: msg.receiver?.full_name ?? '',
      body: msg.message_text,
      sent_at: msg.sent_at?.toISOString?.() ?? msg.sent_at,
      is_read: msg.read_status === 'read',
    };
  }

  // ─── thread methods ───────────────────────────────────────────────────────

  async getThreadsForUser(userId: number) {
    const currentUser = await this.getUser(userId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    const currentRole = this.normalizeRole(currentUser.role?.role_name);
    let threads: any[] = [];

    if (currentRole === 'student') {
      const group = await this.studentGroupService.getMyGroup(userId);
      if (!group) {
        return [];
      }

      const supervisor = await this.prisma.supervisor.findUnique({
        where: { supervisor_id: Number(group.supervisor_id) },
        include: { user: { include: { role: true } } },
      });

      if (!supervisor?.user) {
        return [];
      }

      threads = [await this.getStudentGroupThread(userId, supervisor.user_id)];
    } else if (currentRole === 'supervisor') {
      const groups = await this.studentGroupService.getSupervisorGroups(userId);
      threads = await Promise.all(
        groups.map(async (group) => {
          const leader = group.members.find((member: any) => member.is_leader) || group.members[0];
          const leaderUserId = Number(leader?.student_user_id);

          if (!Number.isInteger(leaderUserId)) {
            return null;
          }

          return this.getSupervisorGroupThread(userId, leaderUserId);
        }),
      );
      threads = threads.filter(Boolean);
    } else if (currentRole === 'admin') {
      const adminToSupervisorIds = await this.prisma.message.findMany({
        where: {
          OR: [
            { sender_id: userId },
            { receiver_id: userId },
          ],
        },
        select: {
          sender_id: true,
          receiver_id: true,
        },
      });
      const partnerIds = new Set<number>([
        ...adminToSupervisorIds.map((message) => message.sender_id === userId ? message.receiver_id : message.sender_id),
      ]);
      threads = await Promise.all(
        Array.from(partnerIds).map(async (partnerId) => this.getAdminSupervisorThread(userId, partnerId)),
      );
    }

    return threads.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getThreadWith(currentUserId: number, otherUserId: number) {
    const [currentUser, otherUser] = await Promise.all([
      this.getUser(currentUserId),
      this.getUser(otherUserId),
    ]);

    if (!currentUser || !otherUser) {
      throw new NotFoundException(`User ${otherUserId} not found`);
    }

    const currentRole = this.normalizeRole(currentUser.role?.role_name);
    const otherRole = this.normalizeRole(otherUser.role?.role_name);

    if (currentRole === 'student') {
      const group = await this.studentGroupService.getMyGroup(currentUserId);
      if (!group) {
        throw new BadRequestException('You are not part of a team yet');
      }

      const supervisor = await this.prisma.supervisor.findUnique({
        where: { supervisor_id: Number(group.supervisor_id) },
        include: { user: { include: { role: true } } },
      });

      if (!supervisor?.user || supervisor.user.user_id !== otherUserId) {
        throw new BadRequestException('You can only message your team supervisor');
      }

      return this.getStudentGroupThread(currentUserId, otherUserId);
    }

    if (currentRole === 'supervisor') {
      if (otherRole === 'admin') {
        return this.getAdminSupervisorThread(currentUserId, otherUserId);
      }

      return this.getSupervisorGroupThread(currentUserId, otherUserId);
    }

    if (currentRole === 'admin' && otherRole === 'supervisor') {
      return this.getAdminSupervisorThread(currentUserId, otherUserId);
    }

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { sender_id: currentUserId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: currentUserId },
        ],
      },
      include: {
        sender: { include: { role: true } },
        receiver: { include: { role: true } },
      },
      orderBy: { sent_at: 'asc' },
    });

    const lastMsg = messages[messages.length - 1] ?? null;
    const unreadCount = messages.filter(
      (message) => message.receiver_id === currentUserId && message.read_status === 'unread',
    ).length;

    return {
      assignment_id: `${Math.min(currentUserId, otherUserId)}-${Math.max(currentUserId, otherUserId)}`,
      other_user_id: String(otherUserId),
      other_user_name: otherUser.full_name,
      other_user_role: otherUser.role?.role_name ?? '',
      student_id: String(currentUserId),
      student_name: currentUser.full_name,
      supervisor_id: String(otherUserId),
      supervisor_name: otherUser.full_name,
      messages: messages.map((message) => this.mapMessage(message, currentUserId)),
      unread_count: unreadCount,
      last_message_at: lastMsg?.sent_at?.toISOString?.() ?? null,
    };
  }

  // ─── send ─────────────────────────────────────────────────────────────────

  async send(senderId: number, receiverId: number, messageText: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    const [sender, receiver] = await Promise.all([
      this.getUser(senderId),
      this.getUser(receiverId),
    ]);

    // Check if sender is a student with published evaluation
    if (sender?.role?.role_name === 'Student') {
      const hasPublishedEvaluation = await this.evaluationService.hasPublishedEvaluationByUserId(senderId);
      if (hasPublishedEvaluation) {
        throw new BadRequestException('You cannot send messages after your evaluation has been published. Contact your supervisor if you have questions.');
      }
    }

    if (!sender || !receiver) {
      throw new NotFoundException('Sender or receiver not found');
    }

    const senderRole = this.normalizeRole(sender.role?.role_name);
    const receiverRole = this.normalizeRole(receiver.role?.role_name);

    if (senderRole === 'student') {
      const group = await this.studentGroupService.getMyGroup(senderId);
      if (!group) {
        throw new BadRequestException('You are not part of a team yet');
      }

      const supervisor = await this.prisma.supervisor.findUnique({
        where: { supervisor_id: Number(group.supervisor_id) },
        include: { user: true },
      });

      if (!supervisor?.user || supervisor.user.user_id !== receiverId) {
        throw new BadRequestException('Students can only message their team supervisor');
      }
    }

    if (senderRole === 'supervisor') {
      if (receiverRole === 'admin') {
        // allowed
      } else if (receiverRole === 'student') {
        const groups = await this.studentGroupService.getSupervisorGroups(senderId);
        const allowed = groups.some((group) =>
          group.members.some((member: any) => member.student_user_id === String(receiverId)),
        );

        if (!allowed) {
          throw new BadRequestException('Supervisors can only message their team groups or admin');
        }
      } else {
        throw new BadRequestException('Supervisors can only message their team groups or admin');
      }
    }

    if (senderRole === 'admin' && receiverRole === 'supervisor') {
      // allowed
    }

    const message = await this.prisma.message.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: messageText,
        read_status: 'unread',
      },
      include: {
        sender: { include: { role: true } },
        receiver: { include: { role: true } },
      },
    });

    return this.mapMessage(message, senderId);
  }

  // ─── read / inbox ─────────────────────────────────────────────────────────

  async getConversation(userId: number, otherId: number, limit: number, offset: number) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId, receiver_id: otherId },
          { sender_id: otherId, receiver_id: userId },
        ],
      },
      include: {
        sender: { include: { role: true } },
        receiver: { include: { role: true } },
      },
      orderBy: { sent_at: 'asc' },
      skip: offset,
      take: limit,
    });

    const total = await this.prisma.message.count({
      where: {
        OR: [
          { sender_id: userId, receiver_id: otherId },
          { sender_id: otherId, receiver_id: userId },
        ],
      },
    });

    return {
      data: messages.map(m => this.mapMessage(m, userId)),
      pagination: { total, limit, offset },
    };
  }

  async getInbox(userId: number, limit: number, offset: number) {
    const messages = await this.prisma.message.findMany({
      where: { receiver_id: userId },
      include: {
        sender: { include: { role: true } },
        receiver: { include: { role: true } },
      },
      orderBy: { sent_at: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await this.prisma.message.count({ where: { receiver_id: userId } });

    return {
      data: messages.map(m => this.mapMessage(m, userId)),
      pagination: { total, limit, offset },
    };
  }

  async getUnread(userId: number) {
    const messages = await this.prisma.message.findMany({
      where: { receiver_id: userId, read_status: 'unread' },
      include: {
        sender: { include: { role: true } },
        receiver: { include: { role: true } },
      },
      orderBy: { sent_at: 'desc' },
    });

    return messages.map(m => this.mapMessage(m, userId));
  }

  // ─── mark read ────────────────────────────────────────────────────────────

  async markAsRead(messageId: number) {
    return this.prisma.message.update({
      where: { message_id: messageId },
      data: { read_status: 'read' },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.message.updateMany({
      where: { receiver_id: userId, read_status: 'unread' },
      data: { read_status: 'read' },
    });
  }

  // ─── delete ───────────────────────────────────────────────────────────────

  async delete(messageId: number) {
    await this.prisma.message.delete({ where: { message_id: messageId } });
  }

  // ─── broadcast ────────────────────────────────────────────────────────────

  async broadcast(supervisorId: number, message: string, studentIds: number[]) {
    const supervisor = await this.prisma.user.findUnique({
      where: { user_id: supervisorId },
    });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor with id ${supervisorId} not found`);
    }

    return Promise.all(
      studentIds.map(studentId =>
        this.prisma.message.create({
          data: {
            sender_id: supervisorId,
            receiver_id: studentId,
            message_text: message,
            read_status: 'unread',
          },
        }),
      ),
    );
  }
}
