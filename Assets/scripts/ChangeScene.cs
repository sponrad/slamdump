using UnityEngine;
using System.Collections;
//using UnityEditor.SceneManagement;

public class ChangeScene : MonoBehaviour {

	public string destinationScene = "SlamDump";

	public void GoToScene(){
		Debug.Log ("GOTOSCENE");
		UnityEngine.SceneManagement.SceneManager.LoadScene (destinationScene, UnityEngine.SceneManagement.LoadSceneMode.Single);
		Time.timeScale = 1;
	}
}
