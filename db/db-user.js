var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  addUserSubreddit: () => addUserSubreddit,
  batchAddUserSubreddits: () => batchAddUserSubreddits,
  createUser: () => createUser,
  deleteUser: () => deleteUser,
  findUser: () => findUser,
  getAllSubreddits: () => getAllSubreddits,
  getAllUsersSubredditsBarOneUser: () => getAllUsersSubredditsBarOneUser,
  getSpecificUserSetting: () => getSpecificUserSetting,
  getUserSettings: () => getUserSettings,
  getUserSubreddits: () => getUserSubreddits,
  removeUserSubreddit: () => removeUserSubreddit,
  setUserSpecificSetting: () => setUserSpecificSetting
});
var R = __toModule(require("ramda"));
var import_ts_pattern = __toModule(require("ts-pattern"));
var import_pratica = __toModule(require("pratica"));
var import_sequelize = __toModule(require("sequelize"));
var import_ramda_adjunct = __toModule(require("ramda-adjunct"));
var import_prray = __toModule(require("prray"));
var import_SubredditTable = __toModule(require("./entities/SubredditTable"));
var import_SubredditsMasterList = __toModule(require("./entities/SubredditsMasterList"));
var import_Users = __toModule(require("./entities/Users/Users"));
var import_Posts = __toModule(require("./entities/Posts/Posts"));
var import_remove_posts_folders = __toModule(require("../server/controllers/posts/remove-posts-folders"));
var import_utils = __toModule(require("../server/utils"));
async function createUser(userName) {
  await import_Users.UserModel.create({ name: userName }, { ignoreDuplicates: true });
}
function getUserSettings(userName) {
  return import_Users.UserModel.findOne({ where: { name: userName } }).then((userAsModel) => userAsModel == null ? void 0 : userAsModel.get());
}
function findUser(userName) {
  return getUserSettings(userName).then(import_pratica.nullable);
}
function getSpecificUserSetting(userName, settingName) {
  return import_Users.UserModel.findOne({ where: { name: userName }, attributes: [settingName] }).then((user) => user == null ? void 0 : user.get(settingName));
}
function getUserSubreddits(userName) {
  return getSpecificUserSetting(userName, "subreddits");
}
async function batchAddUserSubreddits(userName, subreddits, transaction = null) {
  const userSubs = await getUserSubreddits(userName);
  const omitDuplicateSubs = (currentSubs, newSubs) => {
    const currentSubsLowercase = currentSubs.length ? currentSubs.map((sub) => sub.toLowerCase()) : [];
    const newSubsLowercase = newSubs.map((sub) => sub.toLowerCase());
    return R.uniq([...currentSubsLowercase, ...newSubsLowercase]);
  };
  await import_Users.UserModel.update({ subreddits: omitDuplicateSubs(userSubs, subreddits) }, { where: { name: userName }, transaction });
}
function addUserSubreddit(userName, subreddit, transaction = null) {
  return batchAddUserSubreddits(userName, [subreddit], transaction);
}
async function setUserSpecificSetting(userName, settingName, settingValue) {
  const updateDetails = {
    settingName,
    settingValIsArray: Array.isArray(settingValue)
  };
  await (0, import_ts_pattern.match)(updateDetails).with({ settingName: "subreddits", settingValIsArray: false }, () => addUserSubreddit(userName, settingValue)).with({ settingName: "subreddits", settingValIsArray: true }, () => batchAddUserSubreddits(userName, settingValue)).otherwise(() => import_Users.UserModel.update({ [settingName]: settingValue }, { where: { name: userName } }));
}
function getAllUsersSubredditsBarOneUser(userToOmit) {
  return import_Users.UserModel.findAll({
    attributes: ["subreddits"],
    where: { name: { [import_sequelize.Op.not]: userToOmit } }
  }).then((users) => users.flatMap((userModelSubsAttr) => userModelSubsAttr.get("subreddits")));
}
async function removeUserSubreddit(sequelize, batchRemovePosts, batchRemoveComments, userName, subreddit) {
  const subredditToRemove = subreddit.toLowerCase();
  let postIdsFromSubWeAreRemoving = [];
  const allUsersSubreddits = await getAllUsersSubredditsBarOneUser(userName);
  const noOtherUserHasSubreddit = (allUsersSubs, subToRemove) => !allUsersSubs.includes(subToRemove);
  const thereAreSubsAndPostsNoLongerInUse = noOtherUserHasSubreddit(allUsersSubreddits, subredditToRemove);
  await sequelize.transaction(async (transaction) => {
    await getUserSubreddits(userName).then((userSubs) => import_Users.UserModel.update({ subreddits: R.without([subredditToRemove], userSubs) }, { where: { name: userName }, transaction }));
    if (thereAreSubsAndPostsNoLongerInUse) {
      postIdsFromSubWeAreRemoving = await import_Posts.PostModel.findAll({
        where: { subreddit },
        attributes: ["id"]
      }).then((items) => items.map((item) => item.get().id));
      await Promise.all([
        import_SubredditsMasterList.SubredditsMasterListModel.destroy({ where: { subreddit: subredditToRemove }, transaction }),
        batchRemovePosts(postIdsFromSubWeAreRemoving, transaction),
        (0, import_remove_posts_folders.batchRemovePostsFolder)(postIdsFromSubWeAreRemoving)
      ]);
    }
  }).then(() => thereAreSubsAndPostsNoLongerInUse ? Promise.all([
    (0, import_SubredditTable.removeSubredditTable)(subredditToRemove),
    batchRemoveComments(postIdsFromSubWeAreRemoving)
  ]).then(import_utils.noop) : Promise.resolve());
}
function getAllSubreddits() {
  return import_SubredditsMasterList.SubredditsMasterListModel.findAll({ attributes: ["subreddit"] }).then((subs) => subs.map((subModelAttr) => subModelAttr.get("subreddit")));
}
async function deleteUser(sequelize, batchRemovePosts, batchRemoveComments, userName) {
  let postIdsFromSubsWeAreRemoving = [];
  const subsOfUserToDelete = await getUserSubreddits(userName);
  const otherUsersSubreddits = await getAllUsersSubredditsBarOneUser(userName);
  const subsOfUserToDeleteThatNoOtherUserHas = R.without(otherUsersSubreddits, subsOfUserToDelete);
  const thereAreSubsAndPostsNoLongerInUse = import_ramda_adjunct.default.isNonEmptyArray(subsOfUserToDeleteThatNoOtherUserHas);
  await sequelize.transaction(async (transaction) => {
    await import_Users.UserModel.destroy({ where: { name: userName }, transaction });
    if (!thereAreSubsAndPostsNoLongerInUse)
      return;
    await import_SubredditsMasterList.SubredditsMasterListModel.destroy({
      where: { subreddit: { [import_sequelize.Op.in]: subsOfUserToDeleteThatNoOtherUserHas } },
      transaction
    });
    postIdsFromSubsWeAreRemoving = await import_Posts.PostModel.findAll({
      where: { subreddit: { [import_sequelize.Op.in]: subsOfUserToDeleteThatNoOtherUserHas } },
      attributes: ["id"]
    }).then((items) => items.map((item) => item.get().id));
    return Promise.all([
      batchRemovePosts(postIdsFromSubsWeAreRemoving, transaction),
      (0, import_remove_posts_folders.batchRemovePostsFolder)(postIdsFromSubsWeAreRemoving)
    ]);
  }).then(() => thereAreSubsAndPostsNoLongerInUse ? Promise.all([
    import_prray.default.from(subsOfUserToDeleteThatNoOtherUserHas).forEachAsync((sub) => {
      const subreddit = sub;
      return (0, import_SubredditTable.removeSubredditTable)(subreddit);
    }),
    batchRemoveComments(postIdsFromSubsWeAreRemoving)
  ]).then(import_utils.noop) : Promise.resolve());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addUserSubreddit,
  batchAddUserSubreddits,
  createUser,
  deleteUser,
  findUser,
  getAllSubreddits,
  getAllUsersSubredditsBarOneUser,
  getSpecificUserSetting,
  getUserSettings,
  getUserSubreddits,
  removeUserSubreddit,
  setUserSpecificSetting
});
