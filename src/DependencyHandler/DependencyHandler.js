import path from "path";
import axios from "axios";
import { rm } from "fs/promises";
import decompress from "decompress";
import { Listr, delay } from "listr2";

import { MainConfig, logging, i18next } from "../MainConfig.js";

/**
 * Class to install dependencies.
 * @return {Promise<void>}
 */
class DependencyHandler {
	async installPythonDependencies() {
		const installPyCriCodecs = async ({ task={} }) => {
			try {
				task.title = i18next.t("general.install.preparing_pycricodecs");
		    await delay(500);
		    const { data } = await axios.get("https://github.com/Youjose/PyCriCodecs/archive/refs/heads/main.zip", { responseType: "arraybuffer" });
		    await delay(500);
				task.title = i18next.t("general.temporary.create");
		    const PyCriCodecsDir = path.join(MainConfig.tempDir, "PyCriCodecs");
		    await decompress(data, PyCriCodecsDir);
		    await MainConfig.run("pip", ["install", path.join(PyCriCodecsDir, "PyCriCodecs-main"), "--target", MainConfig.python_modules]);
				task.title = i18next.t("general.temporary.delete");
		    await delay(500);
		    await rm(PyCriCodecsDir, { recursive: true });
				logging.info(i18next.t("general.install.success_pycricodecs"));
				task.title = i18next.t("general.install.success_pycricodecs");
		    await delay(500);
			} catch (err) {
		    logging.error(err);
		    logging.error(err.name);
				logging.error(i18next.t("general.install.failed_pycricodecs"));
				throw new Error(i18next.t("general.install.failed_pycricodecs"));
	    };
		};
		const installOtherDeps = async ({ task={} }) => {
			try {
				task.title = i18next.t("general.install.preparing_otherrequirements");
		    await delay(500);
		    await MainConfig.run("pip", ["install", "UnityPy==1.21.0", "--target", MainConfig.python_modules]);
				logging.info(i18next.t("general.install.success_otherrequirements"));
				task.title = i18next.t("general.install.success_otherrequirements");
		    await delay(500);
			} catch (err) {
		    logging.error(err);
		    logging.error(err.name);
				logging.error(i18next.t("general.install.failed_otherrequirements"));
				throw new Error(i18next.t("general.install.failed_otherrequirements"));
	    };
		};
		
		// Listr
		const subtasks = [installPyCriCodecs, installOtherDeps].map(installDeps => ({
			title: "",
			task: async (_, task) => {
				await installDeps({ task: task });
				task.title = "";
			}
		}));
		const tasks = new Listr();
		tasks.add({
			title: i18next.t("general.install.preparing_deps"),
			task: async (_, task) => (task.newListr(
			  subtasks,
				{ 
					concurrent: 2, 
					exitOnError: false 
				}
			))
		});
		MainConfig.createBox({
			[i18next.t("parameters.process.title")]: i18next.t("parameters.process.name.pythondeps_install")
		})
		await tasks.run().catch(err => logging.error(err.stack));
  };
};

export { DependencyHandler };