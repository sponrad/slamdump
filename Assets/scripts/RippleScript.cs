using UnityEngine;
using System.Collections;

public class RippleScript : MonoBehaviour {

	public float life = 2f;

	private float alpha = 1f;
	private float scale;
	private SpriteRenderer sr;

	// Use this for initialization
	void Start () {
		Destroy (gameObject, life);
		sr = GetComponent<SpriteRenderer> ();

		scale = transform.localScale.x;
	}
	
	// Update is called once per frame
	void Update () {
		alpha -= 0.05f;
		scale -= 0.01f;

		//make it more and more transparent
		sr.color = new Color(1f, 1f, 1f, alpha);
		transform.localScale = new Vector3 (scale, scale, scale);
	}
}
