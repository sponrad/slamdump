using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class GameOverScript : MonoBehaviour {

	public Text scoreText;

	// Use this for initialization
	void Start () {
		scoreText.text = "Score: " + GameObject.Find ("Control").GetComponent<SlamDumpControl> ().score.ToString();
		//scoreText.text = "Score: SSS";
	}
	
	// Update is called once per frame
	void Update () {
	
	}
}
