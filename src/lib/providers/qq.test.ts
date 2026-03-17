import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const getMailboxLockMock = vi.fn();
const logoutMock = vi.fn();
const messageFlagsAddMock = vi.fn();
const messageFlagsRemoveMock = vi.fn();

vi.mock("imapflow", () => ({
  ImapFlow: class ImapFlow {
    connect = connectMock;
    getMailboxLock = getMailboxLockMock;
    logout = logoutMock;
    messageFlagsAdd = messageFlagsAddMock;
    messageFlagsRemove = messageFlagsRemoveMock;
  },
}));

vi.mock("mailparser", () => ({
  simpleParser: vi.fn(),
}));

describe("QQProvider write-back", () => {
  beforeEach(() => {
    connectMock.mockReset();
    getMailboxLockMock.mockReset();
    logoutMock.mockReset();
    messageFlagsAddMock.mockReset();
    messageFlagsRemoveMock.mockReset();

    connectMock.mockResolvedValue(undefined);
    getMailboxLockMock.mockResolvedValue({ release: vi.fn() });
    logoutMock.mockResolvedValue(undefined);
    messageFlagsAddMock.mockResolvedValue(true);
    messageFlagsRemoveMock.mockResolvedValue(true);
  });

  it("marks a QQ message as read using IMAP \\Seen flag with uid mode", async () => {
    const { QQProvider } = await import("./qq");

    const provider = new QQProvider({
      email: "qq@example.com",
      authCode: "auth-code",
    });

    await provider.markMessageRead("123");

    expect(getMailboxLockMock).toHaveBeenCalledWith("INBOX");
    expect(messageFlagsAddMock).toHaveBeenCalledWith(123, ["\\Seen"], {
      uid: true,
      silent: true,
    });
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("toggles QQ star state with IMAP \\Flagged flag", async () => {
    const { QQProvider } = await import("./qq");

    const provider = new QQProvider({
      email: "qq@example.com",
      authCode: "auth-code",
    });

    await provider.setMessageStarred("456", true);
    await provider.setMessageStarred("456", false);

    expect(messageFlagsAddMock).toHaveBeenCalledWith(456, ["\\Flagged"], {
      uid: true,
      silent: true,
    });
    expect(messageFlagsRemoveMock).toHaveBeenCalledWith(456, ["\\Flagged"], {
      uid: true,
      silent: true,
    });
  });
});
